import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MaestraService } from '../../core/services/maestra.service';
import { ComprasService } from '../../core/services/compras.service';
import { AlmacenService } from '../../core/services/almacen.service';
import { SeguridadService } from '../../core/services/seguridad.service';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class DashboardPage implements OnInit {
  stats = {
    especialidades: 0,
    proveedores: 0,
    materiales: 0,
    proyectos: 0,
    usuarios: 0,
    requerimientos: 0,
    ordenes: 0,
    compras: 0,
    kardex: 0
  };

  cargando = true;

  constructor(
    private maestra: MaestraService,
    private compras: ComprasService,
    private almacen: AlmacenService,
    private seguridad: SeguridadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();

    setTimeout(() => {
      this.cargando = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  private loadDashboard(): void {
    this.maestra.especialidades()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.especialidades = x.length; this.cdr.detectChanges(); });

    this.maestra.proveedores()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.proveedores = x.length; this.cdr.detectChanges(); });

    this.maestra.materiales()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.materiales = x.length; this.cdr.detectChanges(); });

    this.maestra.proyectos()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.proyectos = x.length; this.cdr.detectChanges(); });

    this.seguridad.usuarios()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.usuarios = x.length; this.cdr.detectChanges(); });

    this.compras.requerimientos()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.requerimientos = x.length; this.cdr.detectChanges(); });

    this.compras.ordenes()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.ordenes = x.length; this.cdr.detectChanges(); });

    this.compras.compras()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.compras = x.length; this.cdr.detectChanges(); });

    this.almacen.resumen()
      .pipe(catchError(() => of([])))
      .subscribe((x: any[]) => { this.stats.kardex = x.length; this.cdr.detectChanges(); });
  }
}