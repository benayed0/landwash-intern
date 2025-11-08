import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaUpdateService } from './services/pwa-update.service';
import { ForegroundNotificationComponent } from './components/foreground-notification/foreground-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ForegroundNotificationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'landwash-intern';

  constructor(private pwaUpdateService: PwaUpdateService) {}

  ngOnInit() {
    // Initialize PWA update service for automatic cache reload on new deployments
    this.pwaUpdateService.initialize();
  } //
}
