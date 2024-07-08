CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(4) NOT NULL,
	`aisle` text(4),
	`image` text(4),
	`error` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
