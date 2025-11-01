"use client";
import { Button } from '@pn/ui';

export function GamedayPics() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('gameday-pic');
    if (file instanceof File && file.size > 0) {
      console.log('Simulating upload for file:', file.name);
      alert('Shiver me timbers! Your pic has been sent to the captain for review!');
    } else {
      alert('Avast ye! No file selected for upload.');
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="mb-2 font-semibold">Gameday Pics</h3>
      <p className="mb-4 text-zinc-300">Upload your Gameday pics to be featured on our feed!</p>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col space-y-4">
            <input
              type="file"
              name="gameday-pic"
              accept="image/*"
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-white"
            />
            <Button type="submit" className="bg-ecu-gold text-black">
              Upload
            </Button>
        </div>
      </form>
    </section>
  );
}
