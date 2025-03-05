import React from 'react'
import { Dessert, MessageCircleHeart, Sparkle, User } from "lucide-react"

const SidebarVideos = () => {
    const VideoOptions = [
        { id: 1, name: "Đề xuất", Icon: <MessageCircleHeart color='white' /> },
        { id: 2, name: "Ngẫu nhiên", Icon: <Sparkle color='white' /> },
        { id: 3, name: "Quan tâm", Icon: <Dessert color='white' /> },
        { id: 4, name: "Bạn bè", Icon: <User color='white' /> }
    ]
    return (
        <div className='flex flex-col w-[15%] h-full bg-black/80 border border-gray-300 rounded-xl'>
            <h1 className='text-white text-2xl font-bold py-5 px-5'>YiBu</h1>
            <div className='h-auto py-5 w-full space-y-4 '>
                {
                    VideoOptions.map((video) => (
                        <div key={video.id} className='flex justify-start gap-3 items-center px-5  h-[40px] hover:opacity-70 hover:bg-white/5 mx-3 rounded-md transition-all ease-in-out duration-150  cursor-pointer'>
                            {video.Icon}
                            <h3 className='text-white text-lg'>{video.name}</h3>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default SidebarVideos
