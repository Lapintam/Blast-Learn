output "vpc_id" { value = aws_vpc.main.id }
output "alb_dns_name" { value = aws_lb.app.dns_name }
output "private_subnet_ids" { value = values(aws_subnet.private)[*].id }
output "asg_name" { value = aws_autoscaling_group.app.name }
