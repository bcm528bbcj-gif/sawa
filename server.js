const express=require('express');const http=require('http');const {Server}=require('socket.io');
const app=express(),server=http.createServer(app),io=new Server(server);app.use(express.static('public'));
const rooms=new Map();
io.on('connection',s=>{s.on('join',({room,name})=>{room=String(room||'').slice(0,40);name=String(name||'ضيف').slice(0,24);if(!room)return;s.join(room);s.data={room,name};if(!rooms.has(room))rooms.set(room,{video:'',time:0,playing:false});s.emit('state',rooms.get(room));io.to(room).emit('system',`${name} دخل الغرفة`);});
s.on('video',u=>{let r=s.data?.room;if(!r)return;let st=rooms.get(r);st.video=String(u||'').slice(0,2000);st.time=0;st.playing=false;s.to(r).emit('video',st.video)});
s.on('sync',d=>{let r=s.data?.room;if(!r)return;let st=rooms.get(r);st.time=Number(d.time)||0;st.playing=!!d.playing;s.to(r).emit('sync',st)});
s.on('chat',t=>{let r=s.data?.room;if(!r)return;io.to(r).emit('chat',{name:s.data.name,text:String(t||'').slice(0,500),at:Date.now()})});
s.on('disconnect',()=>{let r=s.data?.room;if(r)io.to(r).emit('system',`${s.data.name} خرج من الغرفة`)})});
server.listen(process.env.PORT||3000,()=>console.log('Sawa running'));
