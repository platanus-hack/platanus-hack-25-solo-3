-- Índices para optimizar las queries más comunes

-- Índice en users.phone_number (búsqueda frecuente)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Índice en household_members.phone_number (búsqueda frecuente en get_user_context)
CREATE INDEX IF NOT EXISTS idx_household_members_phone_number ON household_members(phone_number);

-- Índice en household_members.household_id (JOINs frecuentes)
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);

-- Índice en conversations.phone_number (búsqueda frecuente)
CREATE INDEX IF NOT EXISTS idx_conversations_phone_number ON conversations(phone_number);

-- Índice en conversations.session_id (búsqueda frecuente)
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);

-- Índice compuesto para búsquedas de household_members por household_id y role
CREATE INDEX IF NOT EXISTS idx_household_members_household_role ON household_members(household_id, role);

-- Índice en created_at para ordenamiento temporal
CREATE INDEX IF NOT EXISTS idx_household_members_created_at ON household_members(created_at);

-- Índice en conversations.last_message_at para búsquedas temporales
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Comentarios de optimización
COMMENT ON INDEX idx_users_phone_number IS 'Optimiza búsqueda de usuarios por teléfono';
COMMENT ON INDEX idx_household_members_phone_number IS 'Optimiza get_user_context tool';
COMMENT ON INDEX idx_household_members_household_id IS 'Optimiza JOINs con households';

