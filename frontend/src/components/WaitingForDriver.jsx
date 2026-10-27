import React from 'react'

const WaitingForDriver = (props) => {
  return (
    <div>
      <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => {
        if (props.setWaitingForDriver) props.setWaitingForDriver(false);
      }}><i className="text-3xl text-gray-300 ri-arrow-down-wide-line"></i></h5>

      <div className='flex items-center justify-between mt-2'>
        <img className='h-12' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="Driver" />
        <div className='text-right'>
          <h2 className='text-lg font-medium capitalize'>{props.ride?.captain?.fullname?.firstname || 'Driver'}</h2>
          <h4 className='text-xl font-semibold -mt-1 -mb-1'>{props.ride?.captain?.vehicle?.plate || 'DL 01 AB 1234'}</h4>
          <p className='text-sm text-gray-600'>White Swift Dzire</p>
          <div className='mt-1 inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-0.5 rounded text-sm'>
            OTP: {props.ride?.otp || '----'}
          </div>
        </div>
      </div>

      <div className='flex gap-2 justify-between flex-col items-center'>
        <div className='w-full mt-5'>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="ri-map-pin-user-fill text-lg text-emerald-600"></i>
            <div>
              <h3 className='text-sm font-semibold text-gray-500 uppercase'>Pickup</h3>
              <p className='text-base font-medium text-gray-800'>{props.ride?.pickup || 'Pickup point'}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3 border-b-2'>
            <i className="text-lg ri-map-pin-2-fill text-red-500"></i>
            <div>
              <h3 className='text-sm font-semibold text-gray-500 uppercase'>Destination</h3>
              <p className='text-base font-medium text-gray-800'>{props.ride?.destination || 'Destination'}</p>
            </div>
          </div>
          <div className='flex items-center gap-5 p-3'>
            <i className="ri-currency-line text-lg text-amber-600"></i>
            <div>
              <h3 className='text-lg font-semibold'>₹{props.ride?.fare}</h3>
              <p className='text-sm -mt-1 text-gray-600'>Cash / Online Payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WaitingForDriver