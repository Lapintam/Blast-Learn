data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_launch_template" "ollama" {
  name_prefix   = "${var.name}-ollama-"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.instance_type
  iam_instance_profile {
    name = var.instance_profile_name
  }
  user_data = base64encode(var.user_data)
  vpc_security_group_ids = [var.security_group_id]
  tags = var.tags
}

resource "aws_autoscaling_group" "ollama" {
  name                      = "${var.name}-ollama"
  max_size                  = var.max_size
  min_size                  = var.min_size
  desired_capacity          = var.desired_capacity
  vpc_zone_identifier       = var.private_subnet_ids
  health_check_type         = "EC2"
  launch_template {
    id      = aws_launch_template.ollama.id
    version = "$Latest"
  }
  tag {
    key                 = "Name"
    value               = "${var.name}-ollama"
    propagate_at_launch = true
  }
}

output "asg_name" {
  value = aws_autoscaling_group.ollama.name
}
