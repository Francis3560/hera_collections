import React from 'react';
import ProfileSetUpSection from '@/pages/authentication/ProfileSetUpSection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ProfilePage() {
  return (
    <div className='min-h-screen bg-background'>
      <Header/>
      <ProfileSetUpSection/>
      <Footer/>

    </div>
  )
}
