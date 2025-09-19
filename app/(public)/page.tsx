import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/start');
  return null;
}
