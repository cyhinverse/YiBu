import React from 'react';

const RouterVideos = () => {
    const routerOptions = [
        { id: 1, name: "Home" },
        { id: 2, name: "Discover" },
        { id: 3, name: "Notifications" },
        { id: 4, name: "Messages" },
        { id: 5, name: "Profile" },
        { id: 6, name: "Create" },
        { id: 7, name: "Following" },
    ];

    return (
        <div className='w-full h-[5%] bg-purple-50 flex gap-5 items-center px-10'>
            {
                routerOptions.map((router) => (
                    <span key={router.id} className="text-black text-sm hover:text-violet-300 cursor-pointer transition-all duration-200 ease-in-out">{router.name}</span>
                ))
            }
        </div>
    );
}

export default RouterVideos;
