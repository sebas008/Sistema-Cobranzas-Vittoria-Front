
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ComprasService } from '../../core/services/compras.service';
import { GastosAdministrativosService } from '../../core/services/gastos-administrativos.service';
import { ValorizacionesService } from '../../core/services/valorizaciones.service';
import { MaestraService } from '../../core/services/maestra.service';

type CompraResumenRow = { especialidad: string; cotizacion: number; facturado: number; saldo: number; };
type ValResumenRow = { especialidad: string; cotizacion: number; garantia: number; transferido: number; facturado: number; saldo: number; };
type GastoResumenRow = { categoria: string; facturado: number; };

@Component({
  standalone: true,
  selector: 'app-resumen-total-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './resumen-total.page.html',
  styleUrl: './resumen-total.page.css'
})
export class ResumenTotalPage implements OnInit {
  loading = false;
  msg = '';

  proyectos: any[] = [];
  selectedProjectId: number | null = null;

  comprasRows: CompraResumenRow[] = [];
  valorizacionesRows: ValResumenRow[] = [];
  gastosRows: GastoResumenRow[] = [];

  cotizacionGeneral = 0;
  totalMateriales = 0;
  totalValorizaciones = 0;
  totalGastos = 0;
  totalTerreno = 0;
  totalAlcabala = 0;
  totalGeneral = 0;
  saldo = 0;

  private comprasSource: any[] = [];
  private valorizacionesSource: any[] = [];
  private gastosSource: any[] = [];

  constructor(
    private comprasService: ComprasService,
    private gastosService: GastosAdministrativosService,
    private valorizacionesService: ValorizacionesService,
    private maestraService: MaestraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.msg = '';

    forkJoin({
      compras: this.comprasService.compras(),
      gastos: this.gastosService.gastos(),
      valorizaciones: this.valorizacionesService.valorizaciones(),
      proyectos: this.maestraService.proyectos(true)
    }).subscribe({
      next: ({ compras, gastos, valorizaciones, proyectos }) => {
        this.comprasSource = Array.isArray(compras) ? compras : [];
        this.gastosSource = Array.isArray(gastos) ? gastos : [];
        this.valorizacionesSource = Array.isArray(valorizaciones) ? valorizaciones : [];
        this.proyectos = (Array.isArray(proyectos) ? proyectos : []).map((row: any) => ({
          ...row,
          cotizacionGeneral: this.toNumber(this.readValue(row, 'cotizacionGeneral', 'CotizacionGeneral')),
          nombreProyecto: String(this.readValue(row, 'nombreProyecto', 'NombreProyecto') || '')
        }));

        if (!this.selectedProjectId && this.proyectos.length) {
          this.selectedProjectId = Number(this.proyectos[0].idProyecto);
        }

        this.rebuildByProject();
      },
      error: (e) => {
        this.msg = e?.error?.message || 'No se pudo cargar el resumen total.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onProjectChange(): void {
    this.rebuildByProject();
  }

  formatMoney(value: any, currency: 'PEN' | 'USD' = 'PEN'): string {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(number);
  }

  totalEjecutadoVsCotizacion(): number {
    if (this.cotizacionGeneral <= 0) return 0;
    return Math.min(100, this.round((this.totalGeneral / this.cotizacionGeneral) * 100));
  }

  proyectoSeleccionadoNombre(): string {
    const proyecto = this.proyectos.find((x: any) => Number(x.idProyecto) === Number(this.selectedProjectId));
    return proyecto?.nombreProyecto || 'Sin proyecto';
  }

  private rebuildByProject(): void {
    const idProyecto = Number(this.selectedProjectId || 0);
    const nombreProyecto = this.proyectoSeleccionadoNombre();

    const proyecto = this.proyectos.find((x: any) => Number(x.idProyecto) === idProyecto);
    this.cotizacionGeneral = this.toNumber(proyecto?.cotizacionGeneral);

    this.buildCompras(this.filterByProject(this.comprasSource, idProyecto, nombreProyecto));
    this.buildValorizaciones(this.filterByProject(this.valorizacionesSource, idProyecto, nombreProyecto));
    this.buildGastos(this.filterByProjectStrict(this.gastosSource, idProyecto, nombreProyecto));
    this.buildTerrenoTotals(idProyecto);

    this.totalGeneral = this.round(this.totalMateriales + this.totalValorizaciones + this.totalGastos + this.totalTerreno + this.totalAlcabala);
    this.saldo = this.round(this.cotizacionGeneral - this.totalGeneral);

    this.loading = false;
    this.cdr.detectChanges();
  }

  private buildCompras(rows: any[]): void {
    const map = new Map<string, CompraResumenRow>();
    for (const row of rows) {
      const especialidad = String(this.readValue(row, 'especialidad', 'Especialidad', 'nombreEspecialidad', 'NombreEspecialidad') || 'Sin especialidad').trim();
      const facturado = this.toNumber(this.readValue(row, 'montoTotal', 'MontoTotal', 'facturado', 'Facturado', 'total', 'Total'));
      const item = map.get(especialidad) || { especialidad, cotizacion: this.cotizacionGeneral, facturado: 0, saldo: 0 };
      item.cotizacion = this.cotizacionGeneral;
      item.facturado += facturado;
      item.saldo = this.round(item.cotizacion - item.facturado);
      map.set(especialidad, item);
    }
    this.comprasRows = Array.from(map.values());
    this.totalMateriales = this.round(this.comprasRows.reduce((a, x) => a + x.facturado, 0));
  }

  private buildValorizaciones(rows: any[]): void {
    const map = new Map<string, ValResumenRow>();
    for (const row of rows) {
      const especialidad = String(this.readValue(row, 'especialidad', 'Especialidad') || 'Sin especialidad').trim();
      const cotizacion = this.toNumber(this.readValue(row, 'cotizacion', 'Cotizacion', 'montoCotizacion', 'MontoCotizacion'));
      const garantia = this.toNumber(this.readValue(row, 'garantia', 'Garantia'));
      const transferido = this.toNumber(this.readValue(row, 'transferido', 'Transferido'));
      const facturado = this.toNumber(this.readValue(row, 'facturado', 'Facturado'));
      const saldo = this.toNumber(this.readValue(row, 'resta', 'Resta', 'saldoPendiente', 'SaldoPendiente')) || this.round(cotizacion - facturado);

      const item = map.get(especialidad) || { especialidad, cotizacion: 0, garantia: 0, transferido: 0, facturado: 0, saldo: 0 };
      item.cotizacion += cotizacion;
      item.garantia += garantia;
      item.transferido += transferido;
      item.facturado += facturado;
      item.saldo += saldo;
      map.set(especialidad, item);
    }
    this.valorizacionesRows = Array.from(map.values());
    this.totalValorizaciones = this.round(this.valorizacionesRows.reduce((a, x) => a + x.facturado, 0));
  }

  private buildGastos(rows: any[]): void {
    const map = new Map<string, GastoResumenRow>();
    for (const row of rows) {
      const categoria = String(this.readValue(row, 'categoria', 'Categoria') || 'Sin categoría').trim();
      const facturado = this.toNumber(this.readValue(row, 'monto', 'Monto', 'total', 'Total'));
      const item = map.get(categoria) || { categoria, facturado: 0 };
      item.facturado += facturado;
      map.set(categoria, item);
    }
    this.gastosRows = Array.from(map.values());
    this.totalGastos = this.round(this.gastosRows.reduce((a, x) => a + x.facturado, 0));
  }

  private buildTerrenoTotals(idProyecto: number): void {
    try {
      const raw = localStorage.getItem('vittoria-terrenos-v4') || localStorage.getItem('vittoria-terrenos-v3') || localStorage.getItem('vittoria-terrenos-v2') || '[]';
      const rows = JSON.parse(raw) as any[];
      const filtrados = rows.filter((x: any) => Number(x.idProyecto || 0) === idProyecto);

      this.totalTerreno = this.round(filtrados
        .filter((x: any) => String(x.concepto || '').trim().toUpperCase() === 'TERRENO')
        .reduce((a: number, x: any) => a + this.readTerrenoMontoSoles(x), 0));

      this.totalAlcabala = this.round(filtrados
        .filter((x: any) => String(x.concepto || '').trim().toUpperCase() === 'ALCABALA')
        .reduce((a: number, x: any) => a + this.readTerrenoMontoSoles(x), 0));
    } catch {
      this.totalTerreno = 0;
      this.totalAlcabala = 0;
    }
  }

  private filterByProject(rows: any[], idProyecto: number, nombreProyecto: string): any[] {
    const proyectoNombre = String(nombreProyecto || '').trim().toLowerCase();
    return rows.filter((row: any) => {
      const sameId = Number(this.readValue(row, 'idProyecto', 'IdProyecto')) === idProyecto;
      const sameName = String(this.readValue(row, 'nombreProyecto', 'NombreProyecto', 'proyecto', 'Proyecto') || '').trim().toLowerCase() === proyectoNombre;
      return sameId || (!!proyectoNombre && sameName);
    });
  }

  private filterByProjectStrict(rows: any[], idProyecto: number, nombreProyecto: string): any[] {
    const proyectoNombre = String(nombreProyecto || '').trim().toLowerCase();
    return rows.filter((row: any) => {
      const rawId = this.readValue(row, 'idProyecto', 'IdProyecto');
      const rawName = this.readValue(row, 'nombreProyecto', 'NombreProyecto', 'proyecto', 'Proyecto');
      const hasProjectData = rawId !== null || (rawName !== null && String(rawName).trim() !== '');
      if (!hasProjectData) return false;

      const sameId = Number(rawId) === idProyecto;
      const sameName = String(rawName || '').trim().toLowerCase() === proyectoNombre;
      return sameId || (!!proyectoNombre && sameName);
    });
  }

  private readTerrenoMontoSoles(row: any): number {
    const montoSoles = Number(row?.montoSoles ?? 0);
    if (montoSoles > 0) return montoSoles;

    const monto = Number(row?.monto ?? 0);
    const moneda = String(row?.moneda || '').trim().toUpperCase();
    if (moneda === 'USD') {
      return this.round(monto * Number(row?.tipoCambio || 3.41));
    }
    return monto;
  }

  private readValue<T = any>(row: any, ...keys: string[]): T | null {
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null) return row[key] as T;
    }
    return null;
  }

  private toNumber(value: any): number {
    return this.round(Number(value || 0));
  }

  private round(value: number): number {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }
}
