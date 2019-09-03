import { Component, OnInit } from '@angular/core';
import { ServerConnectionService } from '../..//service/server-connection.service';

@Component({
  selector: 'app-server-connection-test',
  templateUrl: './server-connection-test.component.html',
  styleUrls: ['./server-connection-test.component.css']
})
export class ServerConnectionTestComponent implements OnInit {

  constructor(private serverConnectionService:ServerConnectionService) { }

  ngOnInit() {
  }

  ping(){
    this.serverConnectionService.ping();
  }

}
