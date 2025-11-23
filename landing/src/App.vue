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

      <!-- CTA Section -->
      <div
        class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border-2 border-[#d4a574]/30"
      >
        <p class="text-lg text-gray-700 mb-6">
          Planifica tus comidas y genera tu lista de compras directamente desde
          WhatsApp
        </p>

        <!-- WhatsApp Button -->
        <a
          :href="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#25D366] to-[#1ea952] text-white font-semibold py-5 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
            />
          </svg>
          <span>Comenzar con WhatsApp</span>
        </a>

        <p class="text-sm text-gray-500 mt-4">
          Al hacer clic, se abrirá WhatsApp con un mensaje prellenado
        </p>
      </div>

      <!-- Features -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
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
  import { computed } from "vue";

  // Número de WhatsApp del negocio (inyectado en build desde secret de Encore)
  const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "56993112178";

  // Mensaje prellenado para WhatsApp
  const welcomeMessage = "Hola! Me gustaría conocer más sobre PlanEat 🍽️";

  // Generar link de WhatsApp
  const whatsappLink = computed(() => {
    const encodedMessage = encodeURIComponent(welcomeMessage);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  });
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
