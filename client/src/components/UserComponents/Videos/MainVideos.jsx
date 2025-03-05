import React from 'react'
import MainContentVideos from './MainContentVideos'
import SidebarVideos from './SidebarVideos'

const MainVideos = () => {
    return (
        <div className="w-[95vw] h-[86vh] bg-purple-50 m-auto rounded-xl mt-5 shadow-md  flex gap-2 justify-between">
            <SidebarVideos />
            <MainContentVideos />
        </div>
    )
}

export default MainVideos
