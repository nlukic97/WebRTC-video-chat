#

## GOAL

Implement the mediasoup sfu to support up to 8 video participants per room.

## TODO TASKS

1. ✅ first user who joins a room by id will create a room (router)

- last user to leave will hav e the room (and its router) deleted

2. ✅ make server send rtpCapabilities to client
3. create mediasoup device, then load with rtpCapabilities
4. create a send transport for producing, and a receive transport for consuming
5. all other users do the steps 2 - 4 (so they will not create this room).

- they should also know what other producers are in the room, so they should use their receive transport to consume each producers video/audio
- other users should be aware of the new producer, they should use their receive transport to consume the new users' video/audio

6. make sure max 8 users can join only (server check)
7. if user leaves, their transports needs closing (which closes their producers), and other users should remove their video
8. if all users leave room, delete the room (router) and clear any data associated with it in server
