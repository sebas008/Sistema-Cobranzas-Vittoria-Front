import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ComprasService } from '../../core/services/compras.service';
import { MaestraService } from '../../core/services/maestra.service';

@Component({ standalone:true, selector:'app-compras-page', imports:[CommonModule, FormsModule], templateUrl:'./compras.page.html', styleUrl:'./compras.page.css' })
export class ComprasPage implements OnInit {
  rows:any[]=[]; proveedores:any[]=[]; ordenes:any[]=[]; materiales:any[]=[]; detalle:any=null; msg='';
  form:any={ numeroCompra:'', idOrdenCompra:null, idProveedor:null, fechaCompra:'', observacion:'', items:[], documentos:[] };
  item:any={ idMaterial:null, cantidad:1, precioUnitario:0 };
  doc:any={ tipoDocumento:'Factura', numeroDocumento:'', rutaArchivo:'', fechaDocumento:'', monto:null, observacion:'' };
  constructor(private compras: ComprasService, private maestra: MaestraService){}
  ngOnInit(){ this.load(); this.maestra.proveedores(true).subscribe(x=>this.proveedores=x); this.compras.ordenes().subscribe(x=>this.ordenes=x); this.maestra.materiales(true).subscribe(x=>this.materiales=x); }
  load(){ this.compras.compras().subscribe(x=>this.rows=x); }
  view(row:any){ this.compras.compra(row.idCompra).subscribe(x=>this.detalle=x); }
  addItem(){ if(!this.item.idMaterial || !this.item.cantidad) return; const mat=this.materiales.find(m=>m.idMaterial===this.item.idMaterial); this.form.items.push({ ...this.item, material: mat?.descripcion }); this.item={ idMaterial:null, cantidad:1, precioUnitario:0 }; }
  addDoc(){ this.form.documentos.push({ ...this.doc }); this.doc={ tipoDocumento:'Factura', numeroDocumento:'', rutaArchivo:'', fechaDocumento:'', monto:null, observacion:'' }; }
  removeItem(i:number){ this.form.items.splice(i,1); }
  removeDoc(i:number){ this.form.documentos.splice(i,1); }
  save(){ this.compras.registrarCompra(this.form).subscribe({ next:()=>{ this.msg='Compra registrada correctamente.'; this.reset(); this.load(); }, error:e=> this.msg=e?.error?.message || 'No se pudo registrar la compra.' }); }
  aceptar(id:number){ this.compras.aceptarCompra(id).subscribe({ next:()=>{ this.msg='Compra aceptada y enviada a kardex.'; this.load(); }, error:e=> this.msg=e?.error?.message || 'No se pudo aceptar la compra.' }); }
  reset(){ this.form={ numeroCompra:'', idOrdenCompra:null, idProveedor:null, fechaCompra:'', observacion:'', items:[], documentos:[] }; }
}
