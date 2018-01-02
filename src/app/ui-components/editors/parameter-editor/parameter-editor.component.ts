import { Component, Injector } from '@angular/core';

import { IGraphNode } from '../../../base-classes/node/NodeModule';
import { InputPort, OutputPort, PortTypes } from '../../../base-classes/port/PortModule';

import { Viewer } from '../../../base-classes/viz/Viewer';
import { FlowchartService } from '../../../global-services/flowchart.service';


@Component({
  selector: 'app-parameter-editor',
  templateUrl: './parameter-editor.component.html',
  styleUrls: ['./parameter-editor.component.scss']
})
export class ParameterEditorComponent extends Viewer{

    isVisible: boolean = false;

    _node: IGraphNode;
    _inputs: InputPort[];
    _outputs: OutputPort[];

    // shift to iport
    portOpts: PortTypes[] = [
        PortTypes.Default, 
        PortTypes.Input, 
        PortTypes.ColorPicker, 
        PortTypes.FilePicker, 
        PortTypes.Dropdown
    ]; 

	  constructor(injector: Injector){  super(injector, "parameter-editor"); }

    reset(){ 
      this._node = undefined;
      this._inputs = undefined;
      this._outputs = undefined;
      this.isVisible = false;
    }


    addPort(nodeIndex: number, type: string): void{

      // add port 
      if(type == "in"){
          this._node.addInput();
      }
      else if(type == "out"){
          this._node.addOutput();
      }
      else{
        throw Error("Unknown Port Type");
      }  

      this.flowchartService.update();
    }

    deletePort(event, type: string, portIndex: number): void{
      event.stopPropagation();

      if(type == "input"){
        this._node.deleteInput(portIndex);
      }
      else if(type == "output"){
        this._node.deleteOutput(portIndex);
      }
      else{
        throw Error("Unknown port type");
      }
    } 

    updatePortName($event, port: InputPort|OutputPort): void{
      let name: string =  $event.srcElement.innerText; 

      if(name.trim().length > 0){
        // put a timeout on this update or something similar to solve jumpiness
        port.setName(name);
        this.flowchartService.update();
      }
    }

    updateInputType(type: PortTypes, input: InputPort){
      input.setType(type);
    }

    updateDefaultValue($event, port: InputPort|OutputPort): void{
      let value: string = $event.srcElement.innerText;

      if(value.trim().length > 0){
        port.setDefaultValue(value)
        // put a timeout on this update or something similar to solve jumpiness
        this.flowchartService.update();
      }

    }

    getTypeName(type: PortTypes): string{
      if(type == PortTypes.ColorPicker){
        return "Color";
      }
      if(type == PortTypes.Default){
        return "Simple Input";
      }
      if(type == PortTypes.Dropdown){
        return "Dropdown";
      }
      if(type == PortTypes.FilePicker){
        return "File";
      }
    }



  	//
  	//	this update runs when there is a message from other viewers that something changed; 
  	//  beware of updating flowchart here - it will go into an unending loop :/
  	//
  	update(): void{
  		this._node = this.flowchartService.getSelectedNode();
      if( this._node !== undefined ){
         this.isVisible = true;
  		   this._inputs = this._node.getInputs();
         this._outputs = this._node.getOutputs();
         this.isVisible = true;
      }
      else{
        this.isVisible = false;
      }
  	}

}
