const Title = ({ text1, text2 }) => {
  return (
    <div className="inline-flex gap-2 items-center mb-3">
      <p className="text-bread-brown">
        {text1} <span className="text-bread-dark font-semibold">{text2}</span>
      </p>
      <p className="w-8 sm:w-12 h-[2px] bg-bread-red"></p>
    </div>
  )
}

export default Title
