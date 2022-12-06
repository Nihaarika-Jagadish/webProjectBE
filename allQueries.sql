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
profile_photo varchar(512) null,
approved boolean default false,
token varchar(100),
created_at datetime,
last_modified datetime,
primary key(user_id, email),
foreign key(role_id) references role_information(role_id) on update cascade);

INSERT INTO role_information(role_name) values('admin');
INSERT INTO role_information(role_name) values('user');



create table user_group_relation(
id int not null auto_increment,
user_id int not null,
groupID varchar(255) not null,
created_at datetime,
last_modified datetime,
primary key(id),
foreign key(user_id) references users(user_id) on update cascade);


SELECT DATA_TYPE, column_name from INFORMATION_SCHEMA.COLUMNS where
table_schema = 'nihaarikaProject' and table_name = 'figure_segmented_nipseval_test2007'


alter table nihaarikaProject.figure_segmented_nipseval_test2007 add annotated boolean default false;

update nihaarikaProject.figure_segmented_nipseval_test2007 set annotated=1 where figure_file='USD0543944-20070605-D00003.png';

SET SQL_SAFE_UPDATES = 0;

create table user_figure_relation(
id int not null auto_increment,
user_id int not null,
figure_file varchar(255) not null,
created_at datetime,
last_modified datetime,
primary key(id),
foreign key(user_id) references users(user_id) on update cascade);