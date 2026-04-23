export default function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // JOIN ROOM: When user joins a video call room
        socket.on('join-room', (data) => {
            const { callId, user } = data;
            socket.join(callId); // Join the room with callId
            console.log(`(${user.email}) joined room: ${callId}`);

            // NOTIFY: Tell others in the room that user joined
            socket.to(callId).emit('user-joined', {
                user: user,
                message: `${user.name} joined the call`
            });
        });

        // CHAT MESSAGE: Handle chat messages in room
        socket.on('chat-message', (data) => {
            const { callId, user, message } = data;

            // BROADCAST: Send message to all users in the room
            io.to(callId).emit('chat-message', {
                user: user,
                message: message,
                timestamp: new Date().toLocaleTimeString()
            });
        });

        //SEND ASKED QUESTION: When interviewer sends a question
        socket.on('asked-question' , (data) => {
            const {question , callId , difficulty} = data;

            // BROADCAST: Send the asked question to the candidate
            io.to(callId).emit('asked-question', {
                question: question,
                difficulty: difficulty,
                timestamp: new Date().toLocaleTimeString()
            });
        });


        //CODE CHANGE: When candidate writes code, send it to interviewer
        socket.on('code-change', (data) => {
            const {user ,language ,code, callId } = data;
            // Broadcast to everyone else in the room, not back to sender.
            socket.to(callId).emit('code-transmission', {
                language: language,
                code: code,
                user: user,
                
            });
        });


        // LEAVE ROOM: When user leaves
        socket.on('leave-room', (data) => {
            const { callId, user } = data;
            socket.leave(callId);
            
            // NOTIFY: Tell others that user left
            socket.to(callId).emit('user-left', {
                user: user,
                message: `${user.name} left the call`
            });
        });

        // DISCONNECT: When user disconnects
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });




    });
}