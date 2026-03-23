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
    servicio: '',
    moneda: 'PEN',
    montoCotizacion: null,
    usuario: 'system'
  };

  formValorizacion: any = {
    idValorizacion: null,
    idConfiguracion: null,
    periodo: '',
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
    otrosDescuentos: 0,
    fechaTransferencia: '',
    numeroOperacion: '',
    bancoTransferencia: '',
    bancoDestino: '',
    montoTransferido: 0,
    usuario: 'system'
  };

  msg = '';
  cargando = false;

  constructor(
    private maestra: MaestraService,
    private valorizaciones: ValorizacionesService
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarConfiguraciones();
    this.cargarValorizaciones();
  }

  get configuracionSeleccionada(): any {
    const id = this.formValorizacion.idConfiguracion || this.cabecera?.idConfiguracion;
    return this.configuraciones.find((x: any) => x.idConfiguracion === id) || null;
  }

  get monedaActual(): string {
    return this.cabecera?.moneda || this.configuracionSeleccionada?.moneda || this.formConfiguracion.moneda || 'PEN';
  }

  get porcentajeGarantiaActual(): number {
    return Number(this.cabecera?.porcentajeGarantia ?? this.configuracionSeleccionada?.porcentajeGarantia ?? 0.05);
  }

  get porcentajeDetraccionActual(): number {
    return Number(this.cabecera?.porcentajeDetraccion ?? this.configuracionSeleccionada?.porcentajeDetraccion ?? 0.04);
  }

  get detraccionHabilitadaPorMonto(): boolean {
    return Number(this.formDetalle.montoFactura || 0) >= 700;
  }

  get porcentajeDetraccionAplicado(): number {
    return this.formDetalle.aplicaDetraccion && this.detraccionHabilitadaPorMonto ? this.porcentajeDetraccionActual : 0;
  }

  get porcentajeGarantiaAplicado(): number {
    return this.formDetalle.aplicaGarantia ? this.porcentajeGarantiaActual : 0;
  }

  get montoDetraccionCalculado(): number {
    return this.redondear(Number(this.formDetalle.montoFactura || 0) * this.porcentajeDetraccionAplicado);
  }

  get montoGarantiaCalculado(): number {
    return this.redondear(Number(this.formDetalle.montoFactura || 0) * this.porcentajeGarantiaAplicado);
  }

  get montoAAbonarCalculado(): number {
    return this.redondear(
      Number(this.formDetalle.montoFactura || 0)
      - this.montoDetraccionCalculado
      - this.montoGarantiaCalculado
      - Number(this.formDetalle.otrosDescuentos || 0)
    );
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
      next: x => this.rows = (x || []).map((r: any) => this.mapValorizacion(r)),
      error: e => this.msg = e?.error?.message || 'No se pudo listar valorizaciones.'
    });
  }

  aplicarFiltros(): void {
    this.cargarConfiguraciones();
    this.cargarValorizaciones();
  }

  editarConfiguracion(row: any): void {
    const c = this.mapConfiguracion(row);
    this.formConfiguracion = {
      idConfiguracion: c.idConfiguracion,
      idProyecto: c.idProyecto,
      idProveedor: c.idProveedor,
      idEspecialidad: c.idEspecialidad,
      servicio: c.servicio || '',
      moneda: c.moneda || 'PEN',
      montoCotizacion: c.montoCotizacion,
      usuario: 'system'
    };
  }

  guardarConfiguracion(): void {
    this.msg = '';
    this.valorizaciones.guardarConfiguracion(this.formConfiguracion).subscribe({
      next: () => {
        this.msg = 'Configuración guardada correctamente.';
        this.formConfiguracion = {
          idConfiguracion: null,
          idProyecto: null,
          idProveedor: null,
          idEspecialidad: null,
          servicio: '',
          moneda: 'PEN',
          montoCotizacion: null,
          usuario: 'system'
        };
        this.cargarConfiguraciones();
      },
      error: e => this.msg = e?.error?.message || 'No se pudo guardar la configuración.'
    });
  }

  crearDesdeConfiguracion(row: any): void {
    const c = this.mapConfiguracion(row);
    this.formValorizacion = {
      idValorizacion: null,
      idConfiguracion: c.idConfiguracion,
      periodo: this.defaultPeriodo(),
      observacion: '',
      usuario: 'system'
    };
    this.cabecera = {
      proyecto: c.proyecto,
      proveedor: c.proveedor,
      especialidad: c.especialidad,
      servicio: c.servicio,
      moneda: c.moneda,
      montoCotizacion: c.montoCotizacion,
      porcentajeGarantia: c.porcentajeGarantia,
      porcentajeDetraccion: c.porcentajeDetraccion
    };
    this.detalle = [];
    this.resumen = null;
    this.formDetalle = this.detalleVacio();
  }

  guardarValorizacion(): void {
    if (!this.formValorizacion.idConfiguracion) {
      this.msg = 'Debes seleccionar o usar una configuración.';
      return;
    }

    this.msg = '';
    this.valorizaciones.guardarValorizacion(this.formValorizacion).subscribe({
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
    this.msg = '';
    this.valorizaciones.valorizacion(idValorizacion).subscribe({
      next: (resp: any) => {
        this.cabecera = this.mapCabecera(resp?.cabecera);
        this.detalle = (resp?.detalle || []).map((r: any) => this.mapDetalle(r));
        this.resumen = this.mapResumen(resp?.resumen);

        this.formValorizacion = {
          idValorizacion: this.cabecera?.idValorizacion || idValorizacion,
          idConfiguracion: this.cabecera?.idConfiguracion || null,
          periodo: this.cabecera?.periodo || '',
          observacion: this.cabecera?.observacion || '',
          usuario: 'system'
        };

        this.formDetalle = this.detalleVacio(idValorizacion);
      },
      error: e => this.msg = e?.error?.message || 'No se pudo obtener la valorización.',
      complete: () => this.cargando = false
    });
  }

  editarDetalle(row: any): void {
    const d = this.mapDetalle(row);
    this.formDetalle = {
      idDetalle: d.idDetalle,
      idValorizacion: this.formValorizacion.idValorizacion,
      fechaFactura: this.toDateInput(d.fechaFactura),
      numeroFactura: d.numeroFactura || '',
      montoFactura: d.montoFactura,
      descripcion: d.descripcion || '',
      aplicaDetraccion: Number(d.detraccion || 0) > 0,
      aplicaGarantia: Number(d.garantia || 0) > 0,
      otrosDescuentos: d.otrosDescuentos || 0,
      fechaTransferencia: this.toDateInput(d.fechaTransferencia),
      numeroOperacion: d.numeroOperacion || '',
      bancoTransferencia: d.bancoTransferencia || '',
      bancoDestino: d.bancoDestino || '',
      montoTransferido: d.montoTransferido || 0,
      usuario: 'system'
    };
  }

  onMontoFacturaChange(): void {
    if (!this.detraccionHabilitadaPorMonto) {
      this.formDetalle.aplicaDetraccion = false;
      return;
    }
    if (!this.formDetalle.idDetalle) {
      this.formDetalle.aplicaDetraccion = true;
    }
  }

  guardarDetalle(): void {
    if (!this.formValorizacion.idValorizacion) {
      this.msg = 'Primero guarda o selecciona una valorización.';
      return;
    }

    this.formDetalle.idValorizacion = this.formValorizacion.idValorizacion;
    this.msg = '';
    this.valorizaciones.guardarDetalle({
      ...this.formDetalle,
      porcentajeDetraccionAplicado: this.porcentajeDetraccionAplicado,
      porcentajeGarantiaAplicado: this.porcentajeGarantiaAplicado
    }).subscribe({
      next: () => {
        this.msg = 'Detalle guardado correctamente.';
        this.ver(this.formValorizacion.idValorizacion);
      },
      error: e => this.msg = e?.error?.message || 'No se pudo guardar el detalle.'
    });
  }

  eliminarDetalle(row: any): void {
    const idDetalle = row?.idDetalle ?? row?.IdValorizacionDetalle;
    if (!idDetalle) return;

    this.valorizaciones.eliminarDetalle(idDetalle, 'system').subscribe({
      next: () => {
        this.msg = 'Detalle eliminado correctamente.';
        if (this.formValorizacion.idValorizacion) this.ver(this.formValorizacion.idValorizacion);
      },
      error: e => this.msg = e?.error?.message || 'No se pudo eliminar el detalle.'
    });
  }

  nuevaValorizacion(): void {
    this.cabecera = null;
    this.detalle = [];
    this.resumen = null;
    this.formValorizacion = {
      idValorizacion: null,
      idConfiguracion: null,
      periodo: this.defaultPeriodo(),
      observacion: '',
      usuario: 'system'
    };
    this.formDetalle = this.detalleVacio();
  }

  formatMoney(value: any, moneda?: string): string {
    const number = Number(value || 0);
    const code = (moneda || this.monedaActual || 'PEN').toUpperCase() === 'USD' ? 'USD' : 'PEN';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  }

  formatPct(value: any): string {
    const number = Number(value || 0) * 100;
    return `${number.toFixed(2)}%`;
  }

  private defaultPeriodo(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private detalleVacio(idValorizacion: number | null = null): any {
    return {
      idDetalle: null,
      idValorizacion,
      fechaFactura: '',
      numeroFactura: '',
      montoFactura: null,
      descripcion: '',
      aplicaDetraccion: false,
      aplicaGarantia: true,
      otrosDescuentos: 0,
      fechaTransferencia: '',
      numeroOperacion: '',
      bancoTransferencia: '',
      bancoDestino: '',
      montoTransferido: 0,
      usuario: 'system'
    };
  }

  private redondear(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  private mapConfiguracion(x: any): any {
    return {
      idConfiguracion: x?.idConfiguracion ?? x?.idProveedorEspecialidadCotizacion ?? x?.IdProveedorEspecialidadCotizacion ?? null,
      idProyecto: x?.idProyecto ?? x?.IdProyecto ?? null,
      proyecto: x?.proyecto ?? x?.nombreProyecto ?? x?.NombreProyecto ?? '',
      nombreProyecto: x?.nombreProyecto ?? x?.NombreProyecto ?? x?.proyecto ?? '',
      idProveedor: x?.idProveedor ?? x?.IdProveedor ?? null,
      proveedor: x?.proveedor ?? x?.razonSocial ?? x?.Proveedor ?? '',
      razonSocial: x?.razonSocial ?? x?.Proveedor ?? x?.proveedor ?? '',
      idEspecialidad: x?.idEspecialidad ?? x?.IdEspecialidad ?? null,
      especialidad: x?.especialidad ?? x?.nombreEspecialidad ?? x?.Especialidad ?? '',
      nombreEspecialidad: x?.nombreEspecialidad ?? x?.Especialidad ?? x?.especialidad ?? '',
      servicio: x?.servicio ?? x?.Servicio ?? '',
      moneda: x?.moneda ?? x?.Moneda ?? 'PEN',
      montoCotizacion: Number(x?.montoCotizacion ?? x?.MontoCotizacion ?? 0),
      porcentajeGarantia: Number(x?.porcentajeGarantia ?? x?.PorcentajeGarantia ?? 0.05),
      porcentajeDetraccion: Number(x?.porcentajeDetraccion ?? x?.PorcentajeDetraccion ?? 0.04)
    };
  }

  private mapValorizacion(x: any): any {
    return {
      idValorizacion: x?.idValorizacion ?? x?.IdValorizacion ?? null,
      periodo: x?.periodo ?? x?.numeroValorizacion ?? x?.NumeroValorizacion ?? '',
      proyecto: x?.proyecto ?? x?.nombreProyecto ?? x?.NombreProyecto ?? '',
      nombreProyecto: x?.nombreProyecto ?? x?.NombreProyecto ?? x?.proyecto ?? '',
      proveedor: x?.proveedor ?? x?.razonSocial ?? x?.Proveedor ?? '',
      razonSocial: x?.razonSocial ?? x?.Proveedor ?? x?.proveedor ?? '',
      especialidad: x?.especialidad ?? x?.nombreEspecialidad ?? x?.Especialidad ?? '',
      nombreEspecialidad: x?.nombreEspecialidad ?? x?.Especialidad ?? x?.especialidad ?? '',
      moneda: x?.moneda ?? x?.Moneda ?? 'PEN',
      montoCotizacion: Number(x?.montoCotizacion ?? x?.Cotizacion ?? 0),
      porcentajeGarantia: Number(x?.porcentajeGarantia ?? x?.PorcentajeGarantia ?? 0.05),
      porcentajeDetraccion: Number(x?.porcentajeDetraccion ?? x?.PorcentajeDetraccion ?? 0.04),
      facturado: Number(x?.facturado ?? x?.Facturado ?? 0),
      transferido: Number(x?.transferido ?? x?.Transferido ?? 0),
      garantiaRetenida: Number(x?.garantiaRetenida ?? x?.GarantiaRetenida ?? 0),
      detraccionAcumulada: Number(x?.detraccionAcumulada ?? x?.DetraccionAcumulada ?? 0)
    };
  }

  private mapCabecera(x: any): any {
    if (!x) return null;
    return {
      idValorizacion: x?.idValorizacion ?? x?.IdValorizacion ?? null,
      idConfiguracion: x?.idConfiguracion ?? x?.IdProveedorEspecialidadCotizacion ?? null,
      periodo: x?.periodo ?? x?.NumeroValorizacion ?? '',
      observacion: x?.observacion ?? x?.Observacion ?? '',
      proyecto: x?.proyecto ?? x?.nombreProyecto ?? x?.NombreProyecto ?? '',
      proveedor: x?.proveedor ?? x?.razonSocial ?? x?.Proveedor ?? '',
      especialidad: x?.especialidad ?? x?.nombreEspecialidad ?? x?.Especialidad ?? '',
      servicio: x?.servicio ?? x?.Servicio ?? '',
      moneda: x?.moneda ?? x?.Moneda ?? 'PEN',
      montoCotizacion: Number(x?.montoCotizacion ?? x?.Cotizacion ?? 0),
      porcentajeGarantia: Number(x?.porcentajeGarantia ?? x?.PorcentajeGarantia ?? 0.05),
      porcentajeDetraccion: Number(x?.porcentajeDetraccion ?? x?.PorcentajeDetraccion ?? 0.04)
    };
  }

  private mapDetalle(x: any): any {
    return {
      idDetalle: x?.idDetalle ?? x?.IdValorizacionDetalle ?? null,
      fechaFactura: x?.fechaFactura ?? x?.FechaFactura ?? null,
      numeroFactura: x?.numeroFactura ?? x?.NumeroFactura ?? '',
      baseImponible: Number(x?.baseImponible ?? x?.BaseImponible ?? 0),
      igv: Number(x?.igv ?? x?.Igv ?? 0),
      montoFactura: Number(x?.montoFactura ?? x?.MontoFactura ?? 0),
      descripcion: x?.descripcion ?? x?.Descripcion ?? '',
      detraccion: Number(x?.detraccion ?? x?.MontoDetraccion ?? 0),
      garantia: Number(x?.garantia ?? x?.MontoGarantia ?? 0),
      otrosDescuentos: Number(x?.otrosDescuentos ?? x?.OtrosDescuentos ?? 0),
      aAbonar: Number(x?.aAbonar ?? x?.MontoAbonar ?? 0),
      fechaTransferencia: x?.fechaTransferencia ?? x?.FechaTransferencia ?? null,
      numeroOperacion: x?.numeroOperacion ?? x?.NumeroOperacion ?? '',
      bancoTransferencia: x?.bancoTransferencia ?? x?.BancoTransferencia ?? '',
      bancoDestino: x?.bancoDestino ?? x?.BancoDestino ?? '',
      montoTransferido: Number(x?.montoTransferido ?? x?.MontoTransferido ?? 0),
      aFavor: Number(x?.aFavor ?? x?.MontoAFavor ?? 0),
      deuda: Number(x?.deuda ?? x?.MontoDeuda ?? 0),
      porcentajeAvance: Number(x?.porcentajeAvance ?? x?.PorcentajeAvance ?? 0),
      porcentajeAcumulado: Number(x?.porcentajeAcumulado ?? x?.PorcentajeAcumulado ?? 0),
      porcentajeInicial: Number(x?.porcentajeInicial ?? x?.PorcentajeInicial ?? 0),
      porcentajeFinal: Number(x?.porcentajeFinal ?? x?.PorcentajeFinal ?? 0)
    };
  }

  private mapResumen(x: any): any {
    if (!x) return null;
    return {
      cotizacion: Number(x?.cotizacion ?? x?.Cotizacion ?? 0),
      porcentajeGarantia: Number(x?.porcentajeGarantia ?? x?.PorcentajeGarantia ?? 0.05),
      porcentajeDetraccion: Number(x?.porcentajeDetraccion ?? x?.PorcentajeDetraccion ?? 0.04),
      facturado: Number(x?.facturado ?? x?.Facturado ?? 0),
      transferido: Number(x?.transferido ?? x?.Transferido ?? 0),
      garantiaRetenida: Number(x?.garantiaRetenida ?? x?.GarantiaRetenida ?? x?.garantia ?? x?.Garantia ?? 0),
      detraccionAcumulada: Number(x?.detraccionAcumulada ?? x?.DetraccionAcumulada ?? 0),
      otrosDescuentos: Number(x?.otrosDescuentos ?? x?.OtrosDescuentos ?? 0),
      resta: Number(x?.resta ?? x?.Resta ?? 0),
      liquidar: Number(x?.liquidar ?? x?.Liquidar ?? 0),
      aFavor: Number(x?.aFavor ?? x?.AFavor ?? 0),
      deuda: Number(x?.deuda ?? x?.Deuda ?? 0)
    };
  }

  private toDateInput(value: any): string {
    if (!value) return '';
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }
}
