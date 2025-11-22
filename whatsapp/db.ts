// Instancia compartida de la base de datos
import { SQLDatabase } from "encore.dev/storage/sqldb";

export const db = new SQLDatabase("planeat", { migrations: "./migrations" });
