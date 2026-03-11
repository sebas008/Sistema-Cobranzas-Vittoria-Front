import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AlmacenService } from '../../core/services/almacen.service';
import { MaestraService } from '../../core/services/maestra.service';

@Component({ standalone:true, selector:'app-kardex-page', imports:[CommonModule, FormsModule], templateUrl:'./kardex.page.html', styleUrl:'./kardex.page.css' })
export class KardexPage implements OnInit {
  rows:any[]=[]; resumen:any[]=[]; materiales:any[]=[]; especialidades:any[]=[]; filtros:any={ idMaterial:null, idEspecialidad:null, fechaDesde:'', fechaHasta:'' };
  constructor(private almacen: AlmacenService, private maestra: MaestraService){}
  ngOnInit(){ this.maestra.materiales(true).subscribe(x=>this.materiales=x); this.maestra.especialidades(true).subscribe(x=>this.especialidades=x); this.load(); }
  load(){ this.almacen.kardex(this.filtros).subscribe(x=>this.rows=x); this.almacen.resumen(this.filtros).subscribe(x=>this.resumen=x); }
}
