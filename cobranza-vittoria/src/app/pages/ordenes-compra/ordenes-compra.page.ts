import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ComprasService } from '../../core/services/compras.service';
import { MaestraService } from '../../core/services/maestra.service';

@Component({ standalone:true, selector:'app-ordenes-compra-page', imports:[CommonModule, FormsModule], templateUrl:'./ordenes-compra.page.html', styleUrl:'./ordenes-compra.page.css' })
export class OrdenesCompraPage implements OnInit {
  rows:any[]=[]; requerimientos:any[]=[]; proveedores:any[]=[]; proyectos:any[]=[]; materiales:any[]=[]; detalle:any=null; msg='';
  form:any={ numeroOrdenCompra:'', idRequerimiento:null, idProveedor:null, idProyecto:null, fechaOrdenCompra:'', descripcion:'', idUsuarioCreacion:null, rutaPdf:'', items:[] };
  item:any={ idMaterial:null, cantidad:1, precioUnitario:0 };
  constructor(private compras: ComprasService, private maestra: MaestraService){}
  ngOnInit(){ this.load(); this.compras.requerimientos().subscribe(x=>this.requerimientos=x); this.maestra.proveedores(true).subscribe(x=>this.proveedores=x); this.maestra.proyectos(true).subscribe(x=>this.proyectos=x); this.maestra.materiales(true).subscribe(x=>this.materiales=x); }
  load(){ this.compras.ordenes().subscribe(x=>this.rows=x); }
  view(row:any){ this.compras.orden(row.idOrdenCompra).subscribe(x=>this.detalle=x); }
  addItem(){ if(!this.item.idMaterial || !this.item.cantidad) return; const mat=this.materiales.find(m=>m.idMaterial===this.item.idMaterial); this.form.items.push({ idMaterial:this.item.idMaterial, material:mat?.descripcion, cantidad:this.item.cantidad, precioUnitario:this.item.precioUnitario }); this.item={ idMaterial:null, cantidad:1, precioUnitario:0 }; }
  removeItem(i:number){ this.form.items.splice(i,1); }
  save(){ const dto={ ...this.form, items:this.form.items.map((x:any)=>({ idMaterial:x.idMaterial, cantidad:x.cantidad, precioUnitario:x.precioUnitario })) }; this.compras.crearOrden(dto).subscribe({ next:()=>{ this.msg='Orden registrada correctamente.'; this.reset(); this.load(); }, error:e=>this.msg=e?.error?.message || 'No se pudo crear la orden.' }); }
  reset(){ this.form={ numeroOrdenCompra:'', idRequerimiento:null, idProveedor:null, idProyecto:null, fechaOrdenCompra:'', descripcion:'', idUsuarioCreacion:null, rutaPdf:'', items:[] }; }
}
