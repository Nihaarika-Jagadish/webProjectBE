create database nihaarikaProject;

use nihaarikaProject;

create table role_information(
role_id int not null auto_increment,
role_name varchar(100),
primary key(role_id));


create table users(
user_id int not null auto_increment,
email varchar(500) not null unique,
password varchar(1000) not null,
role_id int,
first_name varchar(50) not null,
last_name varchar(50) null,
user_phone varchar(13) null,
gender varchar(20) not null,
profile_photo varchar(512) null,
approved boolean default false,
token varchar(20),
created_at datetime,
last_modified datetime,
primary key(user_id, email),
foreign key(role_id) references role_information(role_id) on update cascade);

