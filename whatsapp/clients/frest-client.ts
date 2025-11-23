/**
 * Cliente HTTP para la API de Frest
 * Maneja autenticación, rate limiting, retry logic y logging
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import { FREST_API_URL, FREST_API_KEY } from "../secrets";
import {
  FrestApiResponse,
  FrestApiException,
  BuscarUsuarioRequest,
  BuscarUsuarioResponse,
  RegistrarUsuarioRequest,
  RegistrarUsuarioResponse,
  CrearDireccionRequest,
  CrearDireccionResponse,
  ConsultarProductosRequest,
  ConsultarProductosResponse,
  CrearPedidoRequest,
  CrearPedidoResponse,
  ConsultarEstadoPedidoResponse,
} from "./frest-types";

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const TIMEOUT = 30000; // 30 segundos

// ============================================================================
// CLIENTE HTTP
// ============================================================================

export class FrestClient {
  private client: AxiosInstance;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();
  private readonly RATE_LIMIT = 100; // 100 requests per minute

  constructor() {
    this.client = axios.create({
      baseURL: `${FREST_API_URL()}/api/bot`,
      timeout: TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        "X-Bot-Api-Key": FREST_API_KEY(),
      },
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🌐 [Frest API] ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error("❌ [Frest API] Request error:", error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ [Frest API] ${response.config.method?.toUpperCase()} ${
            response.config.url
          } - ${response.status}`
        );
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(
            `❌ [Frest API] ${error.config?.method?.toUpperCase()} ${
              error.config?.url
            } - ${error.response.status}`
          );
        } else {
          console.error(`❌ [Frest API] Network error:`, error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  private checkRateLimit(): void {
    const now = Date.now();
    const elapsedMinutes = (now - this.lastResetTime) / 60000;

    if (elapsedMinutes >= 1) {
      // Reset contador cada minuto
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.RATE_LIMIT) {
      throw new FrestApiException(429, [
        "Rate limit excedido. Máximo 100 requests por minuto.",
      ]);
    }

    this.requestCount++;
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        console.log(
          `⚠️  [Frest API] Retrying... (${
            MAX_RETRIES - retries + 1
          }/${MAX_RETRIES})`
        );
        await this.delay(RETRY_DELAY);
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      // Retry en errores de red o errores del servidor (5xx)
      if (!axiosError.response) return true;
      const status = axiosError.response.status;
      return status >= 500 && status < 600;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================================
  // MANEJO DE ERRORES
  // ============================================================================

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const responseData = axiosError.response.data as any;
        const statusCode = axiosError.response.status;

        // Extraer errores de la respuesta
        const errores = responseData?.errores || [
          responseData?.mensaje || "Error desconocido",
        ];

        throw new FrestApiException(statusCode, errores);
      } else if (axiosError.request) {
        // Error de red (no se recibió respuesta)
        throw new FrestApiException(0, [
          "Error de conexión con Frest API. Verifica tu conexión a internet.",
        ]);
      }
    }

    // Error desconocido
    throw new FrestApiException(500, [
      error.message || "Error inesperado al comunicarse con Frest API",
    ]);
  }

  // ============================================================================
  // MÉTODOS DE LA API
  // ============================================================================

  /**
   * Busca un usuario por su número de teléfono
   * @param telefono Número de teléfono sin el símbolo + (ej: 56995545216)
   */
  async buscarUsuarioPorTelefono(
    telefono: string
  ): Promise<BuscarUsuarioResponse> {
    this.checkRateLimit();

    try {
      const response = await this.retryRequest(() =>
        this.client.post<FrestApiResponse<BuscarUsuarioResponse>>(
          "/usuarios/buscar-por-telefono",
          { telefono } as BuscarUsuarioRequest
        )
      );

      if (response.data.estado === "error") {
        throw new FrestApiException(
          400,
          response.data.errores || ["Error desconocido"]
        );
      }

      return response.data.data!;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Registra un nuevo usuario sin contraseña
   * El usuario recibirá un código de verificación por email
   */
  async registrarUsuario(
    data: RegistrarUsuarioRequest
  ): Promise<RegistrarUsuarioResponse> {
    this.checkRateLimit();

    try {
      const response = await this.retryRequest(() =>
        this.client.post<FrestApiResponse<RegistrarUsuarioResponse>>(
          "/usuarios/registrar",
          data
        )
      );

      if (response.data.estado === "error") {
        throw new FrestApiException(
          422,
          response.data.errores || ["Error de validación"]
        );
      }

      return response.data.data!;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Crea una dirección de despacho para un usuario
   */
  async crearDireccion(
    userId: number,
    data: CrearDireccionRequest
  ): Promise<CrearDireccionResponse> {
    this.checkRateLimit();

    try {
      const response = await this.retryRequest(() =>
        this.client.post<FrestApiResponse<CrearDireccionResponse>>(
          `/usuarios/${userId}/direcciones`,
          data
        )
      );

      if (response.data.estado === "error") {
        throw new FrestApiException(
          400,
          response.data.errores || ["Error al crear dirección"]
        );
      }

      return response.data.data!;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Consulta productos por nombre, obtiene precios y stock en tiempo real
   * Sugiere alternativas si no están disponibles
   */
  async consultarProductos(
    productos: string[],
    bodega_id: number = 1,
    fecha_ventana?: string
  ): Promise<ConsultarProductosResponse> {
    this.checkRateLimit();

    try {
      const request: ConsultarProductosRequest = {
        productos,
        bodega_id,
        fecha_ventana,
      };

      const response = await this.retryRequest(() =>
        this.client.post<FrestApiResponse<ConsultarProductosResponse>>(
          "/productos/consultar",
          request
        )
      );

      if (response.data.estado === "error") {
        throw new FrestApiException(
          400,
          response.data.errores || ["Error al consultar productos"]
        );
      }

      return response.data.data!;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Crea un pedido completo y genera el link de pago
   * Los precios se calculan automáticamente según ofertas vigentes
   */
  async crearPedido(data: CrearPedidoRequest): Promise<CrearPedidoResponse> {
    this.checkRateLimit();

    try {
      const response = await this.retryRequest(() =>
        this.client.post<FrestApiResponse<CrearPedidoResponse>>(
          "/pedidos/crear",
          data
        )
      );

      if (response.data.estado === "error") {
        throw new FrestApiException(
          400,
          response.data.errores || ["Error al crear pedido"]
        );
      }

      return response.data.data!;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Consulta el estado actual de un pedido
   */
  async consultarEstadoPedido(
    pedidoId: number
  ): Promise<ConsultarEstadoPedidoResponse> {
    this.checkRateLimit();

    try {
      const response = await this.retryRequest(() =>
        this.client.get<FrestApiResponse<ConsultarEstadoPedidoResponse>>(
          `/pedidos/${pedidoId}/estado`
        )
      );

      if (response.data.estado === "error") {
        throw new FrestApiException(
          404,
          response.data.errores || ["Pedido no encontrado"]
        );
      }

      return response.data.data!;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// ============================================================================
// INSTANCIA SINGLETON
// ============================================================================

export const frestClient = new FrestClient();
