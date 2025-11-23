/**
 * Types y interfaces para la API de Frest
 * Basado en la documentación oficial de Frest Bot API v1.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum TipoPedido {
  DESPACHO_DOMICILIO = 1,
  RETIRO_TIENDA = 2,
  RETIRO_EXPRESS = 3,
}

export enum FormaPago {
  WEBPAY = "webpay",
  FPAY = "fpay",
  ONECLICK = "oneclick",
  EFECTIVO = "efectivo",
}

export enum EstadoPedido {
  PENDIENTE = "Pendiente",
  PAGADO = "Pagado",
  PREPARANDO = "Preparando",
  EN_REPARTO = "En reparto",
  ENTREGADO = "Entregado",
  CANCELADO = "Cancelado",
}

export enum EstadoPago {
  PENDIENTE = "Pendiente",
  PAGADO = "Pagado",
  RECHAZADO = "Rechazado",
  CANCELADO = "Cancelado",
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface FrestApiResponse<T = any> {
  estado: "ok" | "error";
  data?: T;
  errores?: string[];
  mensaje?: string;
}

// ============================================================================
// USUARIO
// ============================================================================

export interface BuscarUsuarioRequest {
  telefono: string; // Formato: 56995545216 (sin +)
}

export interface DireccionUsuario {
  id: number;
  direccion_completa: string;
  calle: string;
  numero: string;
  depto: string | null;
  comuna: string;
  region: string;
  coordenadas: string; // Formato: "lat,lng"
  observaciones: string | null;
  zona_id: number;
}

export interface UsuarioEncontrado {
  user_id: number;
  nombre: string;
  paterno: string;
  materno: string | null;
  nombre_completo: string;
  email: string;
  celular: string;
  rut: string;
  email_verificado: boolean;
  cantidad_pedidos: number;
  saldo: number;
  direcciones: DireccionUsuario[];
}

export interface BuscarUsuarioResponse {
  encontrado: boolean;
  data?: UsuarioEncontrado;
  mensaje: string;
}

export interface RegistrarUsuarioRequest {
  nombre: string;
  paterno: string;
  materno?: string;
  email: string;
  rut?: string;
  celular: string;
  acepto_terminos: boolean;
}

export interface RegistrarUsuarioResponse {
  user_id: number;
  email: string;
  nombre_completo: string;
  requiere_verificacion: boolean;
  mensaje: string;
}

// ============================================================================
// DIRECCION
// ============================================================================

export interface CrearDireccionRequest {
  calle: string;
  numero: string;
  depto?: string;
  comuna: string;
  region: string;
  coordenadas?: string; // Formato: "lat,lng"
  observaciones?: string;
  estacionamiento_visita?: boolean;
}

export interface CrearDireccionResponse {
  direccion_id: number;
  zona_id: number;
  direccion_completa: string;
  es_valida: boolean;
  mensaje: string;
}

// ============================================================================
// PRODUCTOS
// ============================================================================

export interface ConsultarProductosRequest {
  productos: string[]; // Array de nombres de productos
  bodega_id?: number; // Default: 1 (Centro de Distribución)
  fecha_ventana?: string; // Formato: YYYY-MM-DD
}

export interface ProductoEncontrado {
  producto_id: number;
  nombre: string;
  unidad: string; // Kg, Un, Lt, etc.
  precio: number; // Precio final (ya incluye ofertas)
  stock_disponible: number;
  imagen?: string;
  disponible: boolean;
}

export interface ProductoAlternativa {
  producto_id: number;
  nombre: string;
  precio: number;
  stock_disponible: number;
}

export interface ProductoNoEncontrado {
  buscado: string;
  alternativas: ProductoAlternativa[];
}

export interface ConsultarProductosResponse {
  productos: ProductoEncontrado[];
  no_encontrados: ProductoNoEncontrado[];
  resumen: {
    total_buscados: number;
    total_encontrados: number;
    total_disponibles: number;
  };
}

// ============================================================================
// PEDIDO
// ============================================================================

export interface ItemPedido {
  producto_id: number;
  cantidad: number; // No incluir precio, se calcula automáticamente
}

export interface CrearPedidoRequest {
  user_id: number;
  direccion_id: number;
  ventana_id: number;
  bodega_id: number;
  tipo_pedido_id: TipoPedido;
  forma_pago: FormaPago;
  items: ItemPedido[];
  observaciones?: string;
  codigo_descuento?: string;
  medio_pago_id?: number; // Para oneclick
}

export interface CrearPedidoResponse {
  pedido_id: number;
  codigo_pedido: string; // Formato: FRE-12345
  total: number;
  subtotal: number;
  despacho: number;
  descuento: number;
  forma_pago: string;
  payment_link: string;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  expires_at: string; // ISO 8601
  mensaje: string;
}

// ============================================================================
// ESTADO PEDIDO
// ============================================================================

export interface TrackingInfo {
  repartidor?: string;
  ruta_id?: number;
  estado_ruta?: string;
}

export interface ConsultarEstadoPedidoResponse {
  pedido_id: number;
  codigo: string;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  total: number;
  fecha_creacion: string; // ISO 8601
  fecha_ventana: string; // YYYY-MM-DD
  tracking_info?: TrackingInfo;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface FrestApiError {
  estado: "error";
  errores: string[];
  statusCode?: number;
}

export class FrestApiException extends Error {
  public readonly statusCode: number;
  public readonly errores: string[];

  constructor(statusCode: number, errores: string[]) {
    super(errores.join(", "));
    this.name = "FrestApiException";
    this.statusCode = statusCode;
    this.errores = errores;
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type FrestApiMethod =
  | "buscarUsuarioPorTelefono"
  | "registrarUsuario"
  | "crearDireccion"
  | "consultarProductos"
  | "crearPedido"
  | "consultarEstadoPedido";

