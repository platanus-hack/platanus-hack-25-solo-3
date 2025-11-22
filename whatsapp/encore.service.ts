import { Service } from "encore.dev/service";

// Encore will consider this directory and all its subdirectories as part of the "whatsapp" service.
// https://encore.dev/docs/ts/primitives/services

// The whatsapp service handles WhatsApp bot interactions for PlanEat.
export default new Service("whatsapp");
