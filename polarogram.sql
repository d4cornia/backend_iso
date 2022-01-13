-- phpMyAdmin SQL Dump
-- version 5.1.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 13, 2022 at 01:28 PM
-- Server version: 10.4.18-MariaDB
-- PHP Version: 7.4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `polarogram`
--
CREATE DATABASE IF NOT EXISTS `polarogram` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `polarogram`;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

DROP TABLE IF EXISTS `chats`;
CREATE TABLE `chats` (
  `id` int(9) NOT NULL,
  `dm_relation` varchar(255) NOT NULL,
  `user_sender_id` int(9) NOT NULL,
  `user_receiver_id` int(9) NOT NULL,
  `message` varchar(255) NOT NULL,
  `status` int(1) NOT NULL DEFAULT 2 COMMENT '0 = deleted, 1=read, 2=unread',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `chats`
--

INSERT INTO `chats` (`id`, `dm_relation`, `user_sender_id`, `user_receiver_id`, `message`, `status`, `created_at`, `deleted_at`) VALUES
(1, '1', 1, 3, 'Nice to meet you ', 1, '2022-01-13 19:20:01', NULL),
(2, '1', 1, 3, 'How are you ?', 1, '2022-01-13 19:20:11', NULL),
(3, '1', 3, 1, 'Good', 2, '2022-01-13 19:20:33', NULL),
(4, '1', 3, 1, 'Nice to meet you too Jo', 2, '2022-01-13 19:20:38', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `dm`
--

DROP TABLE IF EXISTS `dm`;
CREATE TABLE `dm` (
  `id` int(9) NOT NULL,
  `dm_relation` int(9) NOT NULL,
  `user_id_1` int(11) NOT NULL COMMENT 'yang memulai create dm',
  `user_id_2` int(11) NOT NULL COMMENT 'target',
  `status` int(11) NOT NULL COMMENT '0 = deleted, 1 =active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted-at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `dm`
--

INSERT INTO `dm` (`id`, `dm_relation`, `user_id_1`, `user_id_2`, `status`, `created_at`, `deleted-at`) VALUES
(1, 1, 1, 3, 1, '2022-01-13 19:17:34', NULL),
(2, 1, 3, 1, 1, '2022-01-13 19:17:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(9) NOT NULL,
  `sender_id` int(9) NOT NULL COMMENT 'object : user relationship, user likes, user comments, user dm',
  `receiver_id` int(9) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` int(1) NOT NULL DEFAULT 0 COMMENT '0=unread\r\n1=read',
  `status` int(1) NOT NULL COMMENT '0= tdk aktif\r\n1= notif follow\r\n2= notif like\r\n3= notif komen\r\n4 = notif dm',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `sender_id`, `receiver_id`, `message`, `is_read`, `status`, `created_at`, `deleted_at`) VALUES
(1, 1, 1, 'has liked your post', 0, 2, '2022-01-12 20:04:52', NULL),
(2, 3, 1, 'started following you', 0, 1, '2022-01-12 20:09:13', NULL),
(3, 3, 1, 'has liked your post', 0, 2, '2022-01-12 20:10:04', NULL),
(4, 3, 1, 'commented on your post', 0, 3, '2022-01-12 20:10:22', NULL),
(5, 1, 3, 'started following you', 0, 1, '2022-01-12 20:11:21', NULL),
(6, 1, 3, 'has liked your post', 0, 2, '2022-01-12 20:11:23', NULL),
(7, 1, 3, 'commented on your post', 0, 3, '2022-01-12 20:11:30', NULL),
(8, 1, 1, 'has liked your post', 0, 2, '2022-01-12 20:14:27', NULL),
(9, 1, 3, 'send you a message', 0, 4, '2022-01-13 19:20:01', NULL),
(10, 1, 3, 'send you a message', 0, 4, '2022-01-13 19:20:11', NULL),
(11, 3, 1, 'send you a message', 0, 4, '2022-01-13 19:20:33', NULL),
(12, 3, 1, 'send you a message', 0, 4, '2022-01-13 19:20:38', NULL),
(13, 3, 3, 'has liked your post', 0, 2, '2022-01-13 19:22:44', NULL),
(14, 3, 3, 'commented on your post', 0, 3, '2022-01-13 19:22:51', NULL),
(15, 1, 3, 'has liked your post', 0, 2, '2022-01-13 19:23:03', NULL),
(16, 1, 3, 'commented on your post', 0, 3, '2022-01-13 19:23:11', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts` (
  `id` int(9) NOT NULL,
  `user_id` int(9) NOT NULL COMMENT 'User yang ngepost',
  `cloudinary_id` varchar(255) NOT NULL,
  `caption` varchar(255) NOT NULL,
  `tag` varchar(255) NOT NULL,
  `status` int(1) NOT NULL DEFAULT 1 COMMENT '0 = deleted, 1 = image, 2 = video',
  `created_at` datetime DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `cloudinary_id`, `caption`, `tag`, `status`, `created_at`, `deleted_at`) VALUES
(1, 1, '04a4wcdQ8cKm8ql6o87y9r056L8345J6pGAa9g4r84PI89x1J8360m45V02qd769015190t34F051394u6K8142v6w82zCD3DQ4C', 'Hold my hands.. #love', '#love', 1, '2022-01-12 20:03:31', NULL),
(2, 1, '98191FW1a02L7Pt477fZt2mDZzF070jAbJd9jiUS3zo670397eC6Znq4089316bR161yZnA7H4x8dyD9R13377K3Z4N83373YWhy', 'Look at my eyes #photography', '#photography', 1, '2022-01-12 20:04:46', NULL),
(3, 3, '4w07IyT60155r70v2Q46BWN9RfkZx1SSj8C65r1q98LF31xT754qA8599942H6u2pU080EW5X6i4r8670n1ydT3g139oYi6A96jG', 'Black Jack #blackjag', '#blackjag', 1, '2022-01-12 20:07:30', NULL),
(4, 3, '4mv887Gvie9J49Ffs7iKZL5GugRd453R6O356r254r1R582V2eFC3c1384ov8haO0Uknv33S474P2sb70y17aPve19Sh7ttm384W', 'Green.. #greenflower', '#greenflower', 1, '2022-01-13 19:22:06', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(9) NOT NULL,
  `username` varchar(255) NOT NULL COMMENT 'unik',
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `verification_code` varchar(6) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `age` int(3) NOT NULL,
  `description` varchar(255) NOT NULL,
  `image_id` varchar(255) NOT NULL,
  `status` int(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `verification_code`, `name`, `age`, `description`, `image_id`, `status`, `created_at`, `deleted_at`) VALUES
(1, 'joesentosa123', '54d213dc929882be0a8cfb8544cd68c004c35ed04a5dcfb387f2d8f2480557d0', 'joesentosa1@gmail.com', NULL, 'Joe Sentosa ', 21, 'Anak IT ', '05w14w74070o43puE658393kWazp4H89078fkIN1t2zBv7ZM89SqU341tzhVDc31l41Jxt9z205204572Xv0j9w2R23NHA112Qv9', 1, '2022-01-12 19:27:25', NULL),
(2, 'robby123', '54d213dc929882be0a8cfb8544cd68c004c35ed04a5dcfb387f2d8f2480557d0', 'robbygiovani@gmail.com', NULL, 'Robby Giovanni', 21, 'Back End Developer', 'F4iXJZzZb4rd2wpN2vL872iuF5Am3CMZ48029D0y80T29543L18n80R4631GzkE2emK38qq94N835MWChK10JJttjDh9h1K1rAX8', 1, '2022-01-12 19:28:18', NULL),
(3, 'david123', '54d213dc929882be0a8cfb8544cd68c004c35ed04a5dcfb387f2d8f2480557d0', 'david@gmail.com', NULL, 'David Kristian', 20, 'Valorant Player', 'rOnu3yjQ6zmj367HA9vV1j8598i287c746JlzL0TmQ0Bn4z1wa1Si28778LPS0B8M71qw8p1v312564H2j9f205sAPl3uvK59Z6N', 1, '2022-01-12 19:30:06', NULL),
(4, 'yosua123', '54d213dc929882be0a8cfb8544cd68c004c35ed04a5dcfb387f2d8f2480557d0', 'yosua@gmail.com', NULL, 'Yosua Yuwono', 21, 'Front End Developer', '0hvRP734Sz1r094496NqEJ6f7vQ7jx2Y74X1T736ow14KHc141E73aT6Z75In51242Kq8AVn749lewa953E667q93D0t8qI372XA', 1, '2022-01-12 19:30:37', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_comments`
--

DROP TABLE IF EXISTS `user_comments`;
CREATE TABLE `user_comments` (
  `id` int(9) NOT NULL,
  `user_id` int(9) NOT NULL,
  `post_id` int(9) NOT NULL,
  `comment` varchar(255) NOT NULL,
  `status` int(1) NOT NULL DEFAULT 1,
  `notif_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_comments`
--

INSERT INTO `user_comments` (`id`, `user_id`, `post_id`, `comment`, `status`, `notif_id`, `created_at`, `deleted_at`) VALUES
(1, 3, 1, 'Nice pic!', 1, 4, '2022-01-12 20:10:22', NULL),
(2, 1, 3, 'Woaahhh nice jacket!', 1, 7, '2022-01-12 20:11:30', NULL),
(3, 3, 4, 'Nice flower', 1, 14, '2022-01-13 19:22:51', NULL),
(4, 1, 4, 'Woaaa nice pic', 1, 16, '2022-01-13 19:23:12', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_likes`
--

DROP TABLE IF EXISTS `user_likes`;
CREATE TABLE `user_likes` (
  `id` int(9) NOT NULL,
  `user_id` int(9) NOT NULL COMMENT 'user yang ngelike',
  `post_id` int(9) NOT NULL,
  `status` int(1) NOT NULL DEFAULT 1 COMMENT '0 = unlike, 1 = like',
  `notif_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_likes`
--

INSERT INTO `user_likes` (`id`, `user_id`, `post_id`, `status`, `notif_id`, `created_at`, `deleted_at`) VALUES
(1, 1, 1, 1, 1, '2022-01-12 20:04:52', NULL),
(2, 3, 1, 1, 3, '2022-01-12 20:10:04', NULL),
(3, 1, 3, 1, 6, '2022-01-12 20:11:23', NULL),
(4, 1, 2, 1, 8, '2022-01-12 20:14:27', NULL),
(5, 3, 4, 1, 13, '2022-01-13 19:22:45', NULL),
(6, 1, 4, 1, 15, '2022-01-13 19:23:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_relationships`
--

DROP TABLE IF EXISTS `user_relationships`;
CREATE TABLE `user_relationships` (
  `id` int(9) NOT NULL,
  `user_id` int(9) NOT NULL,
  `followed_user_id` int(9) NOT NULL,
  `status` int(1) NOT NULL COMMENT '0 = non active (ga follow), 1 = active (follow), 2 = blocked',
  `notif_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `user_relationships`
--

INSERT INTO `user_relationships` (`id`, `user_id`, `followed_user_id`, `status`, `notif_id`, `created_at`, `deleted_at`) VALUES
(1, 3, 1, 1, 2, '2022-01-12 20:09:13', NULL),
(2, 1, 3, 1, 5, '2022-01-12 20:11:21', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dm`
--
ALTER TABLE `dm`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_comments`
--
ALTER TABLE `user_comments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_likes`
--
ALTER TABLE `user_likes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_relationships`
--
ALTER TABLE `user_relationships`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `dm`
--
ALTER TABLE `dm`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_comments`
--
ALTER TABLE `user_comments`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_likes`
--
ALTER TABLE `user_likes`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_relationships`
--
ALTER TABLE `user_relationships`
  MODIFY `id` int(9) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
