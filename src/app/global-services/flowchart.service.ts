import {Injectable, Input, Output} from '@angular/core';
import {Observable} from 'rxjs';
import {Subject} from 'rxjs/Subject';

import {IFlowchart, Flowchart, FlowchartReader} from '../base-classes/flowchart/FlowchartModule';
import {IGraphNode, GraphNode} from '../base-classes/node/NodeModule';
import {ICodeGenerator, CodeFactory, IModule, ModuleUtils} from "../base-classes/code/CodeModule";

import * as CircularJSON from 'circular-json';

import * as ModuleSet from "../../assets/modules/AllModules";
/*import * as ModuleSet from "gs-modelling";*/

@Injectable()
export class FlowchartService {

  /*private _ffactory = new FlowchartFactory();
  private _fc = new FlowchartConverter();*/

  private _user: string = "AKM";
 
  private _origData: any;
  private _flowchart: IFlowchart;

  private code_generator: ICodeGenerator = CodeFactory.getCodeGenerator("js");
  private _moduleSet: IModule[];
  private _moduleMap: IModule[];

  private _selectedNode: number = 0;
  private _selectedPort: number = 0;

  private _savedNodes: IGraphNode[] = [];

  private check(){
    return this._flowchart != undefined;
  }

  constructor() { 
    this.newFile();
    this.checkSavedNodes();
  };

  checkSavedNodes(): void{ 

    this._savedNodes = [];
    
    let myStorage = window.localStorage;
    let property = "MOBIUS_NODES";
    let storageString = myStorage.getItem(property);
    let nodesStorage = JSON.parse( storageString == null ? JSON.stringify({n: []}) : storageString );

    let nodeData = nodesStorage.n; 

    for(let n=0; n < nodeData.length; n++){
        let n_data = nodeData[n];
        this._savedNodes.push(n_data);
    }
  }

  // 
  // message handling between components
  // 
  private subject = new Subject<any>();
  sendMessage(message: string) {
      this.subject.next({ text: message });
  }
 
  clearMessage() {
      this.subject.next();
  }

  getMessage(): Observable<any> {
      return this.subject.asObservable();
  }

  //
  //  message to all viewers that flowchart updated
  //
  update(): void{
    this.sendMessage("Updated");
  }

  
  readTextFile(file: string){
      
  }

  loadFile(fileString: string): void{

      let _this = this;
      let jsonData: {language: string, flowchart: JSON, modules: JSON};
      try{
        let data = CircularJSON.parse(fileString);

        // load the required modules
         /* _this.modules.loadModules(data["module"]); */

        // load the required code generator
        if (_this.code_generator.getLanguage() != data["language"] && data["language"] !== undefined){
          _this.code_generator = CodeFactory.getCodeGenerator(data["language"])
        }

        // read the flowchart
        _this._flowchart = FlowchartReader.readFlowchartFromData(data["flowchart"]);
        _this.update();
        
      }
      catch(err){
        alert("Error loading file");
      }

  }

  loadModules(modules: Object[]): void{

    this._moduleSet = [];
    this._moduleMap = [];
    let moduleSet = this._moduleSet;
    let moduleMap = this._moduleMap;

    /*let mod: IModule = { name: "gs-modeling", version: "0.1", author: "AKM"};
    for(let prop in ModuleSet){
      mod[prop] = ModuleSet[prop];
    }

    moduleSet.push(mod);
    moduleMap["gs-modeling"] = mod;

    */
    modules.map(function(mod){

        let name: string = ModuleUtils.getName(mod);
        let version: string = ModuleUtils.getVersion(mod);
        let author: string = ModuleUtils.getAuthor(mod);

        // select the required module from the global module set - that has all the functions
        let modClass = ModuleSet[name]; //ModuleUtils.getModuleFromSet(ModuleSet, name);
        if( ModuleUtils.isCompatible(mod, modClass) ){
              moduleSet.push(modClass);
              moduleMap[name] = modClass;
        }
        else{
            throw Error("Module not compatible. Please check version / author");
        }

    })

  }

  getModules(): IModule[]{
    return this._moduleSet;
  }

  //
  // gets the textual representation of the actual flowchart
  //
  getChartData(): string{
    return JSON.stringify(this._flowchart); //this._fc.flowchartToData(this._flowchart);
  }

  //
  //  check if flowchart is there
  //
  hasFlowchart(): boolean{
    return this._flowchart != undefined;
  }

  //
  //
  //
  newFile(): IFlowchart{
    this._flowchart = new Flowchart(this._user);
    this._selectedNode = 0;
    this._selectedPort = 0;
    this.update();

    this.loadModules([{_name: "SimpleMath", _version: 0.1, _author: "Patrick"}, 
                      {_name: "ComplexMath", _version: 0.1, _author: "Patrick"},
                      {_name: "Model", _version: 0.1, _author: "Patrick"},
                      {_name: "Point", _version: 0.1, _author: "Patrick"},
                      {_name: "Pline", _version: 0.1, _author: "Patrick"}]);

    return this._flowchart;
  }

  //
  //  returns the flowchart
  //
  getFlowchart(): IFlowchart{
    //console.warn("Flowchart shouldnot be modified outside of this service");
    return this._flowchart; 
  }

  getNodes(): IGraphNode[]{
    return this._flowchart.getNodes();
  }

  getEdges(): any[]{
    return this._flowchart.getEdges();
  }

  getSavedNodes(): any{
    return this._savedNodes;
  }

  saveNode(node: IGraphNode|number): void{

    if( typeof node == "number"){
      node = this._flowchart.getNodeByIndex(node);
    }

    // todo: check if overwrite
    if( node.getType() !== undefined ){
        console.log(this._savedNodes[node.getType()]);
    }
    else{
      let nav: any = navigator;
      let myStorage = window.localStorage;

      let property = "MOBIUS_NODES";
      let storageString = myStorage.getItem(property);
      let nodesStorage = JSON.parse( storageString == null ? JSON.stringify({n: []}) : storageString );

      // add the node
      nodesStorage.n.push(node);
      myStorage.setItem( property, JSON.stringify(nodesStorage) );
      console.log( JSON.parse(myStorage.getItem(property)).n.length + " nodes in the library" );

      /*if (nav.storage && nav.storage.persist)
        nav.storage.persist().then(granted => {
          if (granted){

            alert("Storage will not be cleared except by explicit user action");
          }
          else{
            alert("Storage may be cleared by the UA under storage pressure.");
          }
        });*/

      this.checkSavedNodes();
      this.update();
    }


  }

  clearLibrary(): void{
    let nav: any = navigator;
    let myStorage = window.localStorage;

    let property = "MOBIUS_NODES";
    let storageString = myStorage.removeItem(property);

    this.checkSavedNodes();
    this.update();
  }


  //
  //    add node
  //
  addNode(type?: number): void{
    
    let new_node: IGraphNode = undefined;
    let n_data = undefined; 

    if(type !== undefined){
      n_data = this._savedNodes[type];
      let default_node_name: string = n_data["_name"] + (this._flowchart.getNodes().length + 1);
      new_node = new GraphNode(default_node_name, n_data["_id"]);
      n_data["lib"] = true;
      new_node.update(n_data);
    }
    else{
      let default_node_name: string = "hello" + (this._flowchart.getNodes().length + 1);
      new_node = new GraphNode(default_node_name, undefined);
    }

    this._flowchart.addNode(new_node);

    this.update();
  }

  addEdge(outputAddress: number[], inputAddress: number[]):  void{
      this._flowchart.addEdge(outputAddress, inputAddress);

      let output = this._flowchart.getNodeByIndex(outputAddress[0]).getOutputByIndex(outputAddress[1])
      output.connect();
      let input = this._flowchart.getNodeByIndex(inputAddress[0]).getInputByIndex(inputAddress[1])
      input.connect();

      input.setComputedValue({port: outputAddress});

      this._flowchart.getNodeByIndex(inputAddress[0]).getInputByIndex(inputAddress[1])
      this.update();
  }


  deleteNode(node_index: number): void{
      this._selectedNode = undefined;
      this._flowchart.deleteNode(node_index);
      this.update();
  }
 

  deleteEdge(): void{

  }

  //
  //  select node
  //
  selectNode(nodeIndex: number): void{
    this._selectedNode = nodeIndex;
    this._selectedPort = undefined;
    this.update();
  }

  selectPort(outputportIndex: number):void{
    this._selectedPort = outputportIndex; 
    this.update();
  }

  getSelectedNode(): IGraphNode{

    if(this._selectedNode == undefined)
      return undefined;

    return this._flowchart.getNodeByIndex(this._selectedNode);
  }

  getSelectedPort(): any{
    // todo: where is this used?
    return this.getSelectedNode().getOutputByIndex(this._selectedPort);
  }

  //
  //  
  //
  isSelected(node: IGraphNode): boolean{
    if(this._selectedNode == undefined){
      return false; 
    }
    return this._flowchart.getNodeByIndex(this._selectedNode).getId() == node.getId();
  }


  // 
  //  run this flowchart
  //
  execute(): any{
      this._flowchart.execute(this.code_generator, this._moduleMap);
      this.update();
  }

  //
  // get execution code    
  //
  getCode(): string{
    return this.code_generator.getDisplayCode(this._flowchart);
  }

  saveFile(): void{
    let file = {};
    let fileString: string;

    file["language"] = "js";
    file["modules"] = [];
    file["flowchart"] = this._flowchart;

    fileString = CircularJSON.stringify(file);

    this.downloadContent({
        type: 'text/plain;charset=utf-8',
        filename: 'Scene' + (new Date()).getTime() + ".mob",
        content: fileString
    });
  }

  downloadContent(options) {
      if (!options || !options.content) {
          throw 'You have at least to provide content to download';
      }
      options.filename = options.filename || 'scene.mob';
      options.type = options.type || 'text/plain;charset=utf-8';
      options.bom = options.bom || decodeURIComponent('%ef%bb%bf');
   
      if (window.navigator.msSaveBlob) {
          var blob = new Blob([options.bom + options.content],
                   {type: options.type });
          window.navigator.msSaveBlob(blob, options.filename);
      }
      else {
          var link = document.createElement('a');
          var content = options.bom + options.content;
          var uriScheme = ['data:', options.type, ','].join('');
          link.href = uriScheme + content;
          link.download = options.filename;
          //FF requires the link in actual DOM
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  }



}
