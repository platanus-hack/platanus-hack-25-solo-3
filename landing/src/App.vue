<template>
  <div
    class="min-h-screen bg-[#f5f3ed] flex items-center justify-center px-4 relative overflow-hidden"
  >
    <!-- Decorative elements -->
    <div class="absolute inset-0 pointer-events-none opacity-10">
      <!-- Left side decorations -->
      <div class="absolute top-20 left-10 text-[#d4a574]">
        <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"
          />
        </svg>
      </div>
      <div class="absolute top-60 left-5 text-[#d4a574]">
        <svg class="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M7.2 14.8L6 18H4V6h12v6h5l3 4v4h-2" />
        </svg>
      </div>

      <!-- Right side decorations -->
      <div class="absolute top-32 right-10 text-[#d4a574]">
        <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
      </div>
      <div class="absolute top-72 right-16 text-[#d4a574]">
        <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path
            d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"
          />
        </svg>
      </div>
    </div>

    <!-- Main content -->
    <div class="relative z-10 w-full max-w-3xl mx-auto text-center">
      <!-- Logo -->
      <div class="mb-8 flex justify-center">
        <img
          src="/logo.png"
          alt="PlanEat Logo"
          class="h-32 w-auto drop-shadow-lg"
        />
      </div>

      <!-- Main heading -->
      <h1
        class="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1e3a5f] mb-6 leading-tight"
      >
        Tu Menú Semanal y<br />
        Lista de Compras,<br />
        Optimizados por IA
      </h1>

      <!-- Form -->
      <div
        class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border-2 border-[#d4a574]/30"
      >
        <!-- WhatsApp input -->
        <div class="mb-6">
          <div
            class="flex items-center bg-white border-2 border-[#d4a574] rounded-xl px-4 py-4 focus-within:ring-2 focus-within:ring-[#d4a574] focus-within:ring-opacity-50 transition-all"
          >
            <svg
              class="w-6 h-6 text-[#25D366] mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
              />
            </svg>
            <input
              v-model="phoneNumber"
              type="tel"
              placeholder="Ingresa tu número de WhatsApp para comenzar"
              class="flex-1 bg-transparent outline-none text-[#1e3a5f] placeholder-gray-400 text-lg"
              @keyup.enter="handleSubmit"
            />
          </div>
        </div>

        <!-- Submit button -->
        <button
          @click="handleSubmit"
          :disabled="!phoneNumber || isSubmitting"
          class="w-full bg-gradient-to-r from-[#d4a574] to-[#b8905f] text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {{ isSubmitting ? "Enviando..." : "Comenzar" }}
        </button>

        <!-- Success/Error message -->
        <transition name="fade">
          <div
            v-if="message"
            class="mt-6 p-6 rounded-xl border-2 whitespace-pre-line"
            :class="
              messageType === 'success'
                ? 'bg-green-50 text-green-900 border-green-300'
                : 'bg-red-100 text-red-800 border-red-300'
            "
          >
            <div
              v-if="messageType === 'success'"
              class="flex flex-col items-center text-center space-y-3"
            >
              <svg
                class="w-16 h-16 text-green-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
                />
              </svg>
              <p class="text-lg font-semibold">{{ message }}</p>
            </div>
            <p v-else class="text-center">{{ message }}</p>
          </div>
        </transition>
      </div>

      <!-- Features -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div
          class="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md border border-[#d4a574]/20"
        >
          <div class="text-3xl mb-3">✨</div>
          <h3 class="font-semibold text-[#1e3a5f] mb-2">Personalizado</h3>
          <p class="text-gray-600 text-sm">
            Menús adaptados a tus gustos y restricciones alimentarias
          </p>
        </div>
        <div
          class="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md border border-[#d4a574]/20"
        >
          <div class="text-3xl mb-3">🛒</div>
          <h3 class="font-semibold text-[#1e3a5f] mb-2">Lista Inteligente</h3>
          <p class="text-gray-600 text-sm">
            Genera tu lista de compras automáticamente
          </p>
        </div>
        <div
          class="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-md border border-[#d4a574]/20"
        >
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="font-semibold text-[#1e3a5f] mb-2">Rápido y Fácil</h3>
          <p class="text-gray-600 text-sm">
            Todo desde WhatsApp, sin apps adicionales
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from "vue";

  const phoneNumber = ref("");
  const isSubmitting = ref(false);
  const message = ref("");
  const messageType = ref<"success" | "error">("success");

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");

    // If it starts with 569 (Chile mobile), it's already formatted
    if (cleaned.startsWith("569")) {
      return cleaned;
    }

    // If it starts with 56, add 9 for mobile
    if (cleaned.startsWith("56")) {
      return "569" + cleaned.slice(2);
    }

    // If it starts with 9, add 56
    if (cleaned.startsWith("9")) {
      return "56" + cleaned;
    }

    // Otherwise, assume it's a Chilean number without country code
    return "569" + cleaned;
  };

  const handleSubmit = async () => {
    if (!phoneNumber.value || isSubmitting.value) return;

    isSubmitting.value = true;
    message.value = "";

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber.value);

      // API URL dinámica según el ambiente
      const API_URL =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.MODE === "production"
          ? "https://api.planeat.life"
          : "http://127.0.0.1:4000");

      // Llamar al endpoint de Encore para iniciar conversación
      const response = await fetch(`${API_URL}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.value = `✅ ¡Listo! Te enviamos un mensaje a WhatsApp (${formattedPhone}).\n\n📱 Revisa tu WhatsApp y continúa la conversación allí para crear tu perfil y comenzar a usar PlanEat.`;
        messageType.value = "success";
        phoneNumber.value = "";
        // El mensaje se queda permanente, no se borra
      } else {
        throw new Error(data.message || "Error al enviar mensaje");
      }
    } catch (error: any) {
      console.error("Error:", error);
      message.value =
        "Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.";
      messageType.value = "error";
    } finally {
      isSubmitting.value = false;
    }
  };
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
