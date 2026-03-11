import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaestraService } from '../../core/services/maestra.service';

@Component({ standalone:true, selector:'app-proveedores-page', imports:[CommonModule, FormsModule], templateUrl:'./proveedores.page.html', styleUrl:'./proveedores.page.css' })
export class ProveedoresPage implements OnInit {
  rows:any[]=[]; especialidades:any[]=[]; filtroEspecialidad:number|null=null; msg='';
  form:any={ razonSocial:'', ruc:'', contacto:'', telefono:'', correo:'', direccion:'', banco:'', cuentaCorriente:'', cci:'', cuentaDetraccion:'', descripcionServicio:'', observacion:'', trabajamosConProveedor:'SI', activo:true };
  asignacion:any={ idEspecialidad:null, activo:true };
  constructor(private maestra: MaestraService){}
  ngOnInit(){ this.maestra.especialidades(true).subscribe(x=>this.especialidades=x); this.load(); }
  load(){ this.maestra.proveedores(undefined, this.filtroEspecialidad).subscribe(x=>this.rows=x); }
  edit(row:any){ this.maestra.proveedor(row.idProveedor).subscribe(res=>{ this.form={...res.proveedor}; }); }
  reset(){ this.form={ razonSocial:'', ruc:'', contacto:'', telefono:'', correo:'', direccion:'', banco:'', cuentaCorriente:'', cci:'', cuentaDetraccion:'', descripcionServicio:'', observacion:'', trabajamosConProveedor:'SI', activo:true }; }
  save(){ this.maestra.guardarProveedor(this.form).subscribe({ next:()=>{ this.msg='Proveedor guardado correctamente.'; this.load(); }, error:e=> this.msg=e?.error?.message || 'No se pudo guardar el proveedor.' }); }
  asignarEspecialidad(){ if(!this.form.idProveedor || !this.asignacion.idEspecialidad) return; this.maestra.setProveedorEspecialidad(this.form.idProveedor, this.asignacion).subscribe({ next:()=>this.msg='Especialidad asignada correctamente.', error:e=> this.msg=e?.error?.message || 'No se pudo asignar la especialidad.' }); }
}
