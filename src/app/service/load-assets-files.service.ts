import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoadAssetsFilesService {

  constructor(private http: HttpClient) { }

  getFile(fileName:string){
    return this.http.get("/assets/files/"+fileName,{responseType: 'text'});
  }
}
