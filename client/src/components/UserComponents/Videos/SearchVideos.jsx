import { Search } from 'lucide-react'
import React from 'react'

const SearchVideos = () => {
    return (
        <div className='w-full h-[8%]  rounded-md flex justify-center items-center border-b border-gray-300 shadow-md '>
            <div className='relative h-[40px] w-[400px] bg-white flex justify-center rounded-md  items-center shadow-md'>
                <input placeholder='Search videos...' type="text" className='bg-white w-[350px] h-[35px] rounded-md outline-none indent-5 ' />
                <Search className='absolute right-5 top-2' />
            </div>
        </div>
    )
}

export default SearchVideos
