from channels.generic.websocket import AsyncJsonWebsocketConsumer

class EventsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json({"event": "connected", "message": "Subscribed to events stream"})

    async def receive_json(self, content, **kwargs):
        await self.send_json({"echo": content})

    async def disconnect(self, code):
        pass
