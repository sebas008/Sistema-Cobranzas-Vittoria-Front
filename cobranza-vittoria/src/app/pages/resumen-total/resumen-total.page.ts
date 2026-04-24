import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ComprasService } from '../../core/services/compras.service';
import { GastosAdministrativosService } from '../../core/services/gastos-administrativos.service';
import { ValorizacionesService } from '../../core/services/valorizaciones.service';

type CompraResumenRow = { especialidad: string; cotizacion: number; facturado: number; saldo: number; };
type ValResumenRow = { especialidad: string; cotizacion: number; garantia: number; transferido: number; facturado: number; saldo: number; };
type GastoResumenRow = { categoria: string; facturado: number; };

@Component({
  standalone: true,
  selector: 'app-resumen-total-page',
  imports: [CommonModule],
  templateUrl: './resumen-total.page.html',
  styleUrl: './resumen-total.page.css'
})
export class ResumenTotalPage implements OnInit {
  loading = false;
  msg = '';

  comprasRows: CompraResumenRow[] = [];
  valorizacionesRows: ValResumenRow[] = [];
  gastosRows: GastoResumenRow[] = [];

  totalMateriales = 0;
  totalValorizaciones = 0;
  totalGastos = 0;
  totalTerreno = 0;
  totalAlcabala = 0;
  totalGeneral = 0;

  constructor(
    private comprasService: ComprasService,
    private gastosService: GastosAdministrativosService,
    private valorizacionesService: ValorizacionesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.msg = '';
    forkJoin({
      compras: this.comprasService.compras(),
      gastos: this.gastosService.gastos(),
      valorizaciones: this.valorizacionesService.valorizaciones()
    }).subscribe({
      next: ({ compras, gastos, valorizaciones }) => {
        this.buildCompras(Array.isArray(compras) ? compras : []);
        this.buildValorizaciones(Array.isArray(valorizaciones) ? valorizaciones : []);
        this.buildGastos(Array.isArray(gastos) ? gastos : []);
        this.buildTerrenoTotals();
        this.totalGeneral = this.totalMateriales + this.totalValorizaciones + this.totalGastos + this.totalTerreno + this.totalAlcabala;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.msg = e?.error?.message || 'No se pudo cargar el resumen total.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatMoney(value: any, currency: 'PEN' | 'USD' = 'PEN'): string {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-PE', {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(number);
  }

  private buildCompras(rows: any[]): void {
    const map = new Map<string, CompraResumenRow>();
    for (const row of rows) {
      const especialidad = String(this.readValue(row, 'especialidad', 'Especialidad', 'nombreEspecialidad', 'NombreEspecialidad') || 'Sin especialidad').trim();
      const cotizacion = Number(this.readValue(row, 'total', 'Total', 'cotizacion', 'Cotizacion', 'montoTotal', 'MontoTotal') || 0);
      const facturado = Number(this.readValue(row, 'montoTotal', 'MontoTotal', 'facturado', 'Facturado', 'total', 'Total') || 0);
      const item = map.get(especialidad) || { especialidad, cotizacion: 0, facturado: 0, saldo: 0 };
      item.cotizacion += cotizacion;
      item.facturado += facturado;
      item.saldo = item.cotizacion - item.facturado;
      map.set(especialidad, item);
    }
    this.comprasRows = Array.from(map.values());
    this.totalMateriales = this.comprasRows.reduce((a, x) => a + x.facturado, 0);
  }

  private buildValorizaciones(rows: any[]): void {
    const map = new Map<string, ValResumenRow>();
    for (const row of rows) {
      const especialidad = String(this.readValue(row, 'especialidad', 'Especialidad') || 'Sin especialidad').trim();
      const cotizacion = Number(this.readValue(row, 'cotizacion', 'Cotizacion', 'montoCotizacion', 'MontoCotizacion') || 0);
      const garantia = Number(this.readValue(row, 'garantia', 'Garantia') || 0);
      const transferido = Number(this.readValue(row, 'transferido', 'Transferido') || 0);
      const facturado = Number(this.readValue(row, 'facturado', 'Facturado') || 0);
      const saldo = Number(this.readValue(row, 'resta', 'Resta', 'saldoPendiente', 'SaldoPendiente') || (cotizacion - facturado));
      const item = map.get(especialidad) || { especialidad, cotizacion: 0, garantia: 0, transferido: 0, facturado: 0, saldo: 0 };
      item.cotizacion += cotizacion;
      item.garantia += garantia;
      item.transferido += transferido;
      item.facturado += facturado;
      item.saldo += saldo;
      map.set(especialidad, item);
    }
    this.valorizacionesRows = Array.from(map.values());
    this.totalValorizaciones = this.valorizacionesRows.reduce((a, x) => a + x.facturado, 0);
  }

  private buildGastos(rows: any[]): void {
    const map = new Map<string, GastoResumenRow>();
    for (const row of rows) {
      const categoria = String(this.readValue(row, 'categoria', 'Categoria') || 'Sin categoría').trim();
      const facturado = Number(this.readValue(row, 'monto', 'Monto', 'total', 'Total') || 0);
      const item = map.get(categoria) || { categoria, facturado: 0 };
      item.facturado += facturado;
      map.set(categoria, item);
    }
    this.gastosRows = Array.from(map.values());
    this.totalGastos = this.gastosRows.reduce((a, x) => a + x.facturado, 0);
  }

  private buildTerrenoTotals(): void {
    try {
      const raw = localStorage.getItem('vittoria-terrenos-v3') || localStorage.getItem('vittoria-terrenos-v2') || '[]';
      const rows = JSON.parse(raw) as any[];
      this.totalTerreno = rows.filter(x => String(x.concepto || '').trim().toUpperCase() === 'TERRENO').reduce((a, x) => a + Number(x.monto || 0), 0);
      this.totalAlcabala = rows.filter(x => String(x.concepto || '').trim().toUpperCase() === 'ALCABALA').reduce((a, x) => a + Number(x.monto || 0), 0);
    } catch {
      this.totalTerreno = 0;
      this.totalAlcabala = 0;
    }
  }

  private readValue<T = any>(row: any, ...keys: string[]): T | null {
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null) return row[key] as T;
    }
    return null;
  }
}
