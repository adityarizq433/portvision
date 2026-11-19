<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $notifications = Notification::with(['device:id,hostname,ip', 'port:id,if_name,if_alias,device_id'])
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        return response()->json($notifications);
    }

    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        $notification->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }
}
