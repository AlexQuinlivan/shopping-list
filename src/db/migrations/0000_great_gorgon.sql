CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aisle` text,
	`image` text,
	`error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
