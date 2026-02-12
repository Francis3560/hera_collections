import React from 'react'
import Header from '@/components/Header' ;
import HeroSection from '@/components/Sections/HeroSection';
import ShopBySubCategory from '@/components/Sections/ShopBySubCategory';
import FeaturedProducts from '@/components/Sections/FeaturedProducts';
import ImageWithText from '@/components/Sections/ImageWithText';
import BestSellingProducts from '@/components/Sections/BestSellingProducts';
import Testimonials from '@/components/Sections/Testimonials';
import Footer from '@/components/Footer';
import { LiveChat } from '@/components/chat/LiveChat';

export default function Index() {
  return (
    <div>
      <Header />
      <HeroSection/>
      <BestSellingProducts/>
      <FeaturedProducts/>
      {/* <ShopBySubCategory/> */}
      {/* <ImageWithText/> */}
      <Testimonials/>
      <Footer/>
      <LiveChat />
    </div>
  )
}