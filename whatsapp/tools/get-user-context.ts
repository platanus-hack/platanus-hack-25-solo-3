import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { db } from "../db";
import { pool } from "../../db/connection";

export const getUserContextTool = tool(
  "get_user_context",
  "Obtiene el contexto completo de un usuario (perfil + household + miembros)",
  {
    phone_number: z.string().describe("Número de WhatsApp del usuario"),
  },
  async ({ phone_number }) => {
    console.log("🔧 TOOL CALLED: get_user_context");
    console.log(`   Phone: ${phone_number}`);

    const user = await db.queryRow`
      SELECT phone_number, display_name, created_at
      FROM users WHERE phone_number = ${phone_number}
    `;

    if (!user) {
      console.log("   Result: User does not exist");
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ exists: false }),
          },
        ],
      };
    }

    console.log("   User found:", user.phone_number);

    // Optimización: Una sola query con JOIN para obtener todo
    let household = null;
    let members = [];

    const householdResult = await db.queryRow`
      SELECT h.*, hm.role
      FROM households h
      JOIN household_members hm ON h.id = hm.household_id
      WHERE hm.phone_number = ${phone_number}
    `;

    if (householdResult) {
      household = householdResult;

      // Obtener miembros en una sola query optimizada
      const membersQuery = pool.query(
        `SELECT name, phone_number, age, relationship, role
         FROM household_members
         WHERE household_id = $1
         ORDER BY 
           CASE role WHEN 'admin' THEN 1 ELSE 2 END,
           created_at`,
        [household.id]
      );

      const membersResult = await membersQuery;
      members = membersResult.rows;
    }

    const result = {
      exists: true,
      user,
      household: household || null,
      members,
    };

    console.log("   Result:", JSON.stringify(result, null, 2));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result),
        },
      ],
    };
  }
);
