data "aws_caller_identity" "current" {}

resource "aws_security_group" "alb_sg" {
  name        = "${var.project}-${var.environment}-alb-sg"
  description = "ALB SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "HTTP"
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    cidr_blocks      = var.allowed_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "${var.project}-${var.environment}-ec2-sg"
  description = "EC2 SG"
  vpc_id      = aws_vpc.main.id

  ingress {
    description      = "from ALB"
    from_port        = 3000
    to_port          = 3000
    protocol         = "tcp"
    security_groups  = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "app" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = values(aws_subnet.public)[*].id
}

resource "aws_lb_target_group" "app_tg" {
  name     = "${var.project}-${var.environment}-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    path                = "/api/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 5
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "authenticate-oidc"
    authenticate_oidc {
      authorization_endpoint = "${var.alb_oidc_issuer}/oauth2/v2.0/authorize"
      token_endpoint         = "${var.alb_oidc_issuer}/oauth2/v2.0/token"
      user_info_endpoint     = "${var.alb_oidc_issuer}/oidc/userinfo"
      client_id              = var.alb_oidc_client_id
      client_secret          = var.alb_oidc_client_secret
      issuer                 = var.alb_oidc_issuer
      on_unauthenticated_request = "authenticate"
      scope = "openid profile email"
      session_cookie_name = "alb-oidc"
      session_timeout     = 604800
    }

    forward {
      target_group_arn = aws_lb_target_group.app_tg.arn
    }
  }
}

resource "aws_iam_role" "ec2_role" {
  name = "${var.project}-${var.environment}-ec2-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.project}-${var.environment}-lt-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  key_name      = var.key_name
  iam_instance_profile { name = aws_iam_instance_profile.ec2_profile.name }
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 60
      volume_type           = "gp3"
      delete_on_termination = true
    }
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -euxo pipefail
              apt-get update
              apt-get install -y amazon-cloudwatch-agent
              mkdir -p /opt/app
              cd /opt/app
              echo "PORT=3000" > .env
              # Placeholder systemd service for Node app
              cat >/etc/systemd/system/app.service <<'UNIT'
              [Unit]
              Description=Policy Manager App
              After=network.target

              [Service]
              WorkingDirectory=/opt/app
              ExecStart=/usr/bin/node server.js
              Restart=always
              User=ubuntu
              Environment=PORT=3000

              [Install]
              WantedBy=multi-user.target
              UNIT

              systemctl daemon-reload
              systemctl enable --now app
              EOF)
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${var.project}-${var.environment}-asg"
  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  vpc_zone_identifier       = values(aws_subnet.private)[*].id
  health_check_type         = "EC2"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project}-${var.environment}-app"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_attachment" "asg_tg" {
  autoscaling_group_name = aws_autoscaling_group.app.name
  alb_target_group_arn   = aws_lb_target_group.app_tg.arn
}
