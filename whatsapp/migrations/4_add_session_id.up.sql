-- Agregar columna session_id para persistencia de sesiones del Agent SDK
ALTER TABLE conversations ADD COLUMN session_id TEXT;

-- Crear índice para búsquedas rápidas por session_id
CREATE INDEX idx_conversations_session_id ON conversations(session_id);

-- Actualizar constraint para permitir upsert sin necesitar usuario previo
ALTER TABLE conversations DROP CONSTRAINT conversations_phone_number_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_phone_number_fkey 
  FOREIGN KEY (phone_number) REFERENCES users(phone_number) 
  ON DELETE CASCADE 
  DEFERRABLE INITIALLY DEFERRED;

