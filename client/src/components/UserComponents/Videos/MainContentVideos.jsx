import React from 'react'
import RouterContent from './RouterContent'
import RouterVideos from './RouterVideos'
import SearchVideos from './SearchVideos'

const MainContentVideos = () => {
    return (
        <div className='flex-1 h-full bg-purple-50  rounded-xl'>
            <SearchVideos />
            <div className='flex flex-col  flex-1 h-[92%] '>
                <RouterVideos />
                <RouterContent />
            </div>
        </div>
    )
}

export default MainContentVideos
