CREATE TABLE `applicationDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicationId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT true,
	`uploadStatus` enum('pending','uploaded','not_required') NOT NULL DEFAULT 'pending',
	`notes` text,
	`fileName` varchar(500),
	`mimeType` varchar(160),
	`fileSizeBytes` int,
	`fileKey` varchar(700),
	`fileUrl` text,
	`uploadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applicationDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('Draft','In Progress','Submitted','Awarded','Rejected') NOT NULL DEFAULT 'Draft',
	`ownerName` varchar(255),
	`notes` text,
	`targetDeadlineAt` timestamp,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `eligibilityAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`score` int NOT NULL,
	`answers` json NOT NULL,
	`rationale` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eligibilityAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int,
	`applicationId` int,
	`type` enum('saved_deadline','application_deadline','application_status') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`dueAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255),
	`sourceName` varchar(255) NOT NULL,
	`sourceUrl` text NOT NULL,
	`applicationUrl` text,
	`title` varchar(500) NOT NULL,
	`slug` varchar(560) NOT NULL,
	`summary` text,
	`description` text,
	`eligibilityText` text,
	`programme` varchar(160),
	`fund` varchar(160),
	`opportunityType` enum('grant','call_for_proposals','cascade_funding','prize','loan','guarantee','equity','procurement','other') NOT NULL DEFAULT 'grant',
	`statusComputed` enum('upcoming','open','closing_soon','closed','unknown') NOT NULL DEFAULT 'unknown',
	`countries` json NOT NULL,
	`sectors` json NOT NULL,
	`applicantTypes` json NOT NULL,
	`documents` json,
	`deadlineAt` timestamp,
	`deadlineText` varchar(255),
	`publishedAt` timestamp,
	`totalBudgetEur` decimal(16,2),
	`minGrantEur` decimal(16,2),
	`maxGrantEur` decimal(16,2),
	`fundingRateMin` decimal(5,2),
	`fundingRateMax` decimal(5,2),
	`sourceConfidence` decimal(4,3) NOT NULL DEFAULT '1.000',
	`extractionConfidence` decimal(4,3) NOT NULL DEFAULT '1.000',
	`lastCheckedAt` timestamp NOT NULL DEFAULT (now()),
	`isPublished` boolean NOT NULL DEFAULT true,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `opportunities_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `opportunities_source_external_unique` UNIQUE(`sourceName`,`externalId`)
);
--> statement-breakpoint
CREATE TABLE `organisationProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`organisationName` varchar(255),
	`organisationType` varchar(100),
	`country` varchar(100),
	`sector` varchar(100),
	`employeeCount` int,
	`projectBudgetEur` decimal(14,2),
	`consortiumPreference` enum('yes','no','open'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organisationProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `organisation_profiles_user_id` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `savedOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedOpportunities_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_opportunities_user_opportunity_unique` UNIQUE(`userId`,`opportunityId`)
);
--> statement-breakpoint
ALTER TABLE `applicationDocuments` ADD CONSTRAINT `applicationDocuments_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `applications` ADD CONSTRAINT `applications_opportunityId_opportunities_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eligibilityAssessments` ADD CONSTRAINT `eligibilityAssessments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eligibilityAssessments` ADD CONSTRAINT `eligibilityAssessments_opportunityId_opportunities_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_opportunityId_opportunities_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_applicationId_applications_id_fk` FOREIGN KEY (`applicationId`) REFERENCES `applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organisationProfiles` ADD CONSTRAINT `organisationProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedOpportunities` ADD CONSTRAINT `savedOpportunities_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedOpportunities` ADD CONSTRAINT `savedOpportunities_opportunityId_opportunities_id_fk` FOREIGN KEY (`opportunityId`) REFERENCES `opportunities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `application_documents_application_idx` ON `applicationDocuments` (`applicationId`);--> statement-breakpoint
CREATE INDEX `applications_user_status_idx` ON `applications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `applications_deadline_idx` ON `applications` (`targetDeadlineAt`);--> statement-breakpoint
CREATE INDEX `eligibility_assessments_user_opportunity_idx` ON `eligibilityAssessments` (`userId`,`opportunityId`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_idx` ON `notifications` (`userId`,`readAt`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notifications_due_idx` ON `notifications` (`dueAt`);--> statement-breakpoint
CREATE INDEX `opportunities_status_deadline_idx` ON `opportunities` (`statusComputed`,`deadlineAt`);--> statement-breakpoint
CREATE INDEX `opportunities_programme_idx` ON `opportunities` (`programme`);--> statement-breakpoint
CREATE INDEX `opportunities_published_idx` ON `opportunities` (`isPublished`,`archivedAt`);--> statement-breakpoint
CREATE INDEX `saved_opportunities_user_idx` ON `savedOpportunities` (`userId`);