ALTER TABLE "business" ADD COLUMN IF NOT EXISTS "whatsapp_message_template" text;--> statement-breakpoint
ALTER TABLE "business" ADD COLUMN IF NOT EXISTS "whatsapp_client_message_template" text;
