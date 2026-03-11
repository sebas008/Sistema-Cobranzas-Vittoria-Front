import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaestraService } from '../../core/services/maestra.service';

@Component({ standalone:true, selector:'app-materiales-page', imports:[CommonModule, FormsModule], templateUrl:'./materiales.page.html', styleUrl:'./materiales.page.css' })
export class MaterialesPage implements OnInit {
  rows:any[]=[]; especialidades:any[]=[]; filtroEspecialidad:number|null=null; msg='';
  form:any={ idEspecialidad:null, codigo:'', descripcion:'', unidadMedida:'', stockMinimo:0, activo:true };
  constructor(private maestra: MaestraService){}
  ngOnInit(){ this.maestra.especialidades(true).subscribe(x=>this.especialidades=x); this.load(); }
  load(){ this.maestra.materiales(undefined, this.filtroEspecialidad).subscribe(x=>this.rows=x); }
  edit(row:any){ this.form={...row}; }
  reset(){ this.form={ idEspecialidad:null, codigo:'', descripcion:'', unidadMedida:'', stockMinimo:0, activo:true }; }
  save(){ this.maestra.guardarMaterial(this.form).subscribe({ next:()=>{ this.msg='Material guardado correctamente.'; this.reset(); this.load(); }, error:e=> this.msg=e?.error?.message || 'No se pudo guardar el material.' }); }
}
