import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestraService } from '../../core/services/maestra.service';
import { ValorizacionesService } from '../../core/services/valorizaciones.service';

@Component({
  standalone: true,
  selector: 'app-valorizaciones-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './valorizaciones.page.html',
  styleUrl: './valorizaciones.page.css'
})
export class ValorizacionesPage implements OnInit {
  proyectos: any[] = [];
  proveedores: any[] = [];
  especialidades: any[] = [];
  configuraciones: any[] = [];
  rows: any[] = [];
  detalle: any[] = [];
  resumen: any = null;
  cabecera: any = null;
  filtros: any = { idProyecto: null, idProveedor: null, idEspecialidad: null };

  formConfiguracion: any = {
    idConfiguracion: null,
    idProyecto: null,
    idProveedor: null,
    idEspecialidad: null,
    empresa: '',
    servicio: '',
    moneda: 'PEN',
    montoCotizacion: null,
    usuario: 'system'
  };

  formValorizacion: any = {
    idValorizacion: null,
    idConfiguracion: null,
    periodo: '',
    empresa: '',
    observacion: '',
    usuario: 'system'
  };

  formDetalle: any = {
    idDetalle: null,
    idValorizacion: null,
    fechaFactura: '',
    numeroFactura: '',
    montoFactura: null,
    descripcion: '',
    aplicaDetraccion: false,
    aplicaGarantia: true,
    fechaTransferencia: '',
    montoTransferido: 0,
    otrosDescuentos: 0
  };

  modalAdjuntarOpen = false;
  modalAdjuntarDetalle: any = null;
  modalAdjuntarFiles: File[] = [];
  msg = '';
  cargando = false;

  constructor(private maestra: MaestraService, private valorizaciones: ValorizacionesService) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarConfiguraciones();
    this.cargarValorizaciones();
  }

  get monedaActual(): string {
    return this.cabecera?.moneda || this.formConfiguracion.moneda || 'PEN';
  }

  get porcentajeGarantiaActual(): number {
    return Number(this.cabecera?.porcentajeGarantia ?? 0.04);
  }

  get porcentajeDetraccionActual(): number {
    return Number(this.cabecera?.porcentajeDetraccion ?? 0.04);
  }

  get detraccionHabilitadaPorMonto(): boolean {
    return Number(this.formDetalle.montoFactura || 0) >= 700;
  }

  get montoDetraccionCalculado(): number {
    return this.formDetalle.aplicaDetraccion && this.detraccionHabilitadaPorMonto
      ? this.redondear(Number(this.formDetalle.montoFactura || 0) * this.porcentajeDetraccionActual) : 0;
  }

  get montoGarantiaCalculado(): number {
    return this.formDetalle.aplicaGarantia
      ? this.redondear(Number(this.formDetalle.montoFactura || 0) * this.porcentajeGarantiaActual) : 0;
  }

  get montoAAbonarCalculado(): number {
    return this.redondear(Number(this.formDetalle.montoFactura || 0) - this.montoDetraccionCalculado - this.montoGarantiaCalculado - Number(this.formDetalle.otrosDescuentos || 0));
  }

  get configuracionActiva(): any | null {
    const id = this.formValorizacion.idConfiguracion || this.cabecera?.idConfiguracion;
    return this.configuraciones.find(x => Number(x.idConfiguracion) === Number(id)) || null;
  }

  cargarCatalogos(): void {
    this.maestra.proyectos(true).subscribe(x => this.proyectos = x || []);
    this.maestra.proveedores(true).subscribe(x => this.proveedores = x || []);
    this.maestra.especialidades(true).subscribe(x => this.especialidades = x || []);
  }

  cargarConfiguraciones(): void {
    this.valorizaciones.configuraciones(this.filtros).subscribe({
      next: x => this.configuraciones = (x || []).map((r: any) => this.mapConfiguracion(r)),
      error: e => this.msg = e?.error?.message || 'No se pudo listar configuraciones.'
    });
  }

  cargarValorizaciones(): void {
    this.valorizaciones.valorizaciones(this.filtros).subscribe({
      next: x => this.rows = x || [],
      error: e => this.msg = e?.error?.message || 'No se pudo listar valorizaciones.'
    });
  }

  aplicarFiltros(): void {
    this.cargarConfiguraciones();
    this.cargarValorizaciones();
  }

  editarConfiguracion(row: any): void {
    this.formConfiguracion = {
      idConfiguracion: row.idConfiguracion,
      idProyecto: row.idProyecto,
      idProveedor: row.idProveedor,
      idEspecialidad: row.idEspecialidad,
      empresa: row.empresa || '',
      servicio: row.servicio || '',
      moneda: row.moneda || 'PEN',
      montoCotizacion: row.montoCotizacion,
      usuario: 'system'
    };
  }

  guardarConfiguracion(): void {
    const payload = {
      idConfiguracion: this.toNullableNumber(this.formConfiguracion.idConfiguracion),
      idProyecto: this.toRequiredNumber(this.formConfiguracion.idProyecto),
      idProveedor: this.toRequiredNumber(this.formConfiguracion.idProveedor),
      idEspecialidad: this.toRequiredNumber(this.formConfiguracion.idEspecialidad),
      empresa: String(this.formConfiguracion.empresa || '').trim(),
      servicio: String(this.formConfiguracion.servicio || '').trim(),
      moneda: String(this.formConfiguracion.moneda || 'PEN').trim(),
      montoCotizacion: Number(this.formConfiguracion.montoCotizacion || 0),
      usuario: 'system'
    };

    if (!payload.idProyecto || !payload.idProveedor || !payload.idEspecialidad) { this.msg = 'Debes seleccionar proyecto, proveedor y especialidad.'; return; }
    if (!payload.empresa) { this.msg = 'Debes ingresar la empresa.'; return; }
    if (!payload.montoCotizacion || payload.montoCotizacion <= 0) { this.msg = 'Debes ingresar una cotización mayor a cero.'; return; }

    this.valorizaciones.guardarConfiguracion(payload).subscribe({
      next: () => {
        this.msg = 'Configuración guardada correctamente.';
        this.formConfiguracion = { idConfiguracion: null, idProyecto: null, idProveedor: null, idEspecialidad: null, empresa: '', servicio: '', moneda: 'PEN', montoCotizacion: null, usuario: 'system' };
        this.cargarConfiguraciones();
      },
      error: e => this.msg = e?.error?.message || 'No se pudo guardar la configuración.'
    });
  }

  onConfiguracionSeleccionada() {
    const cfg = this.configuracionActiva;
    if (!cfg) return;
    this.formValorizacion.empresa = cfg.empresa || '';
    this.cabecera = {
      idConfiguracion: cfg.idConfiguracion,
      proyecto: cfg.proyecto,
      proveedor: cfg.proveedor,
      especialidad: cfg.especialidad,
      empresa: cfg.empresa,
      servicio: cfg.servicio,
      moneda: cfg.moneda,
      cotizacion: cfg.montoCotizacion,
      montoCotizacion: cfg.montoCotizacion,
      porcentajeGarantia: cfg.porcentajeGarantia,
      porcentajeDetraccion: cfg.porcentajeDetraccion
    };
  }

  crearDesdeConfiguracion(row: any) {
    this.formValorizacion = {
      idValorizacion: null,
      idConfiguracion: row.idConfiguracion,
      periodo: this.defaultPeriodo(),
      empresa: row.empresa || '',
      observacion: '',
      usuario: 'system'
    };
    this.onConfiguracionSeleccionada();
    this.detalle = [];
    this.resumen = null;
    this.formDetalle = this.detalleVacio();
  }

  guardarValorizacion(): void {
    const payload = {
      idValorizacion: this.toNullableNumber(this.formValorizacion.idValorizacion),
      idConfiguracion: this.toRequiredNumber(this.formValorizacion.idConfiguracion),
      periodo: String(this.formValorizacion.periodo || '').trim(),
      empresa: String(this.formValorizacion.empresa || '').trim(),
      observacion: String(this.formValorizacion.observacion || '').trim(),
      usuario: 'system'
    };

    if (!payload.idConfiguracion) { this.msg = 'Debes seleccionar o usar una configuración.'; return; }
    if (!payload.empresa) { this.msg = 'Debes ingresar la empresa.'; return; }
    if (!payload.periodo) { this.msg = 'Debes ingresar el periodo.'; return; }

    this.valorizaciones.guardarValorizacion(payload).subscribe({
      next: (resp: any) => {
        const idValorizacion = resp?.idValorizacion ?? resp?.IdValorizacion ?? resp?.id;
        this.msg = 'Valorización guardada correctamente.';
        if (idValorizacion) {
          this.formValorizacion.idValorizacion = idValorizacion;
          this.formDetalle.idValorizacion = idValorizacion;
          this.ver(idValorizacion);
        }
        this.cargarValorizaciones();
      },
      error: e => this.msg = e?.error?.message || 'No se pudo guardar la valorización.'
    });
  }

  ver(idValorizacion: number): void {
    this.cargando = true;
    this.valorizaciones.valorizacion(idValorizacion).subscribe({
      next: (resp: any) => {
        this.cabecera = resp?.cabecera || null;
        this.detalle = resp?.detalle || [];
        this.resumen = resp?.resumen || null;
        this.formValorizacion = {
          idValorizacion: this.cabecera?.idValorizacion || idValorizacion,
          idConfiguracion: this.cabecera?.idConfiguracion || null,
          periodo: this.cabecera?.periodo || '',
          empresa: this.cabecera?.empresa || '',
          observacion: this.cabecera?.observacion || '',
          usuario: 'system'
        };
        this.formDetalle = this.detalleVacio(idValorizacion);
      },
      error: e => this.msg = e?.error?.message || 'No se pudo obtener la valorización.',
      complete: () => this.cargando = false
    });
  }

  onDetalleMontoFacturaChange(): void {
    if (!this.detraccionHabilitadaPorMonto) this.formDetalle.aplicaDetraccion = false;
  }

  guardarDetalle(): void {
    const payload = {
      idDetalle: this.toNullableNumber(this.formDetalle.idDetalle),
      idValorizacion: this.toRequiredNumber(this.formValorizacion.idValorizacion),
      fechaFactura: this.formDetalle.fechaFactura || null,
      numeroFactura: String(this.formDetalle.numeroFactura || '').trim(),
      montoFactura: Number(this.formDetalle.montoFactura || 0),
      descripcion: String(this.formDetalle.descripcion || '').trim(),
      otrosDescuentos: Number(this.formDetalle.otrosDescuentos || 0),
      fechaTransferencia: this.formDetalle.fechaTransferencia || null,
      numeroOperacion: '',
      bancoTransferencia: '',
      bancoDestino: '',
      montoTransferido: Number(this.formDetalle.montoTransferido || 0),
      porcentajeDetraccionAplicado: this.formDetalle.aplicaDetraccion && this.detraccionHabilitadaPorMonto ? this.porcentajeDetraccionActual : 0,
      porcentajeGarantiaAplicado: this.formDetalle.aplicaGarantia ? this.porcentajeGarantiaActual : 0,
      usuario: 'system'
    };

    if (!payload.idValorizacion) { this.msg = 'Primero guarda o selecciona una valorización.'; return; }
    if (!payload.montoFactura) { this.msg = 'Debes ingresar el monto de factura.'; return; }

    this.valorizaciones.guardarDetalle(payload).subscribe({
      next: () => {
        this.msg = 'Detalle guardado correctamente.';
        this.ver(payload.idValorizacion);
      },
      error: e => this.msg = e?.error?.message || 'No se pudo guardar el detalle.'
    });
  }

  abrirAdjuntarFacturas(row: any): void {
    this.modalAdjuntarDetalle = row;
    this.modalAdjuntarFiles = [];
    this.modalAdjuntarOpen = true;
  }

  cerrarAdjuntarFacturas(): void {
    this.modalAdjuntarOpen = false;
    this.modalAdjuntarDetalle = null;
    this.modalAdjuntarFiles = [];
  }

  onModalArchivosSelected(event: any): void {
    const files = Array.from(event?.target?.files || []) as File[];
    this.modalAdjuntarFiles = files.filter((f: File) => f.name.toLowerCase().endsWith('.pdf'));
  }

  guardarAdjuntarFacturas(): void {
    const idDetalle = this.modalAdjuntarDetalle?.idDetalle;
    if (!idDetalle || !this.modalAdjuntarFiles.length) { this.msg = 'Debes seleccionar al menos un PDF.'; return; }

    this.valorizaciones.uploadDetalleArchivos(Number(idDetalle), this.modalAdjuntarFiles).subscribe({
      next: () => {
        this.msg = 'Facturas adjuntas correctamente.';
        if (this.formValorizacion.idValorizacion) this.ver(this.formValorizacion.idValorizacion);
        this.cerrarAdjuntarFacturas();
      },
      error: e => this.msg = e?.error?.message || 'No se pudieron adjuntar las facturas.'
    });
  }

  downloadArchivo(row: any, archivo: any): void {
    const idDetalle = row?.idDetalle;
    const idArchivo = archivo?.idArchivo;
    if (!idDetalle || !idArchivo) return;
    window.open(this.valorizaciones.downloadDetalleArchivoUrl(Number(idDetalle), Number(idArchivo)), '_blank');
  }

  formatMoney(value: any, moneda?: string): string {
    const number = Number(value || 0);
    const code = (moneda || this.monedaActual || 'PEN').toUpperCase() === 'USD' ? 'USD' : 'PEN';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
  }

  nuevaValorizacion(): void {
    this.cabecera = null;
    this.detalle = [];
    this.resumen = null;
    this.formValorizacion = { idValorizacion: null, idConfiguracion: null, periodo: this.defaultPeriodo(), empresa: '', observacion: '', usuario: 'system' };
    this.formDetalle = this.detalleVacio();
  }

  private defaultPeriodo(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private detalleVacio(idValorizacion: number | null = null): any {
    return { idDetalle: null, idValorizacion, fechaFactura: '', numeroFactura: '', montoFactura: null, descripcion: '', aplicaDetraccion: false, aplicaGarantia: true, fechaTransferencia: '', montoTransferido: 0, otrosDescuentos: 0 };
  }

  private toNullableNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private toRequiredNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private redondear(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private mapConfiguracion(x: any): any {
    return {
      idConfiguracion: x?.idConfiguracion ?? x?.idProveedorEspecialidadCotizacion ?? null,
      idProyecto: x?.idProyecto ?? null,
      proyecto: x?.proyecto ?? x?.nombreProyecto ?? '',
      idProveedor: x?.idProveedor ?? null,
      proveedor: x?.proveedor ?? x?.razonSocial ?? '',
      idEspecialidad: x?.idEspecialidad ?? null,
      especialidad: x?.especialidad ?? x?.nombreEspecialidad ?? '',
      empresa: x?.empresa ?? '',
      servicio: x?.servicio ?? '',
      moneda: x?.moneda ?? 'PEN',
      montoCotizacion: Number(x?.montoCotizacion ?? 0),
      porcentajeGarantia: Number(x?.porcentajeGarantia ?? 0.04),
      porcentajeDetraccion: Number(x?.porcentajeDetraccion ?? 0.04)
    };
  }
}
