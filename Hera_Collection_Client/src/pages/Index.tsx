import React from 'react'
import Header from '@/components/Header' ;
import HeroSection from '@/components/Sections/HeroSection';
import ShopByCategory from '@/components/Sections/ShopByCategory';
import FeaturedProducts from '@/components/Sections/FeaturedProducts';
import ImageWithText from '@/components/Sections/ImageWithText';
import BestSellingProducts from '@/components/Sections/BestSellingProducts';
import Testimonials from '@/components/Sections/Testimonials';
import Footer from '@/components/Footer';

export default function Index() {
  return (
    <div>
      <Header />
      <HeroSection/>
      <ShopByCategory/>
      <FeaturedProducts/>
      <ImageWithText/>
      <BestSellingProducts/>
      <Testimonials/>
      <Footer/>
    </div>
  )
}