'use client'

import React from 'react';
import styled from 'styled-components';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const HamburgerMenu = ({ isOpen, onToggle }: HamburgerMenuProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle();
  };

  return (
    <StyledWrapper>
      <label className={`hamburger text-text ${isOpen ? 'checked' : ''}`} onClick={handleClick}>
        <input
          type="checkbox"
          checked={isOpen}
          onChange={() => { }}
          onClick={(e) => e.stopPropagation()}
        />
        <svg viewBox="0 0 32 32">
          <path className="line line-top-bottom" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22" />
          <path className="line" d="M7 16 27 16" />
        </svg>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .hamburger {
    cursor: pointer;
  }

  .hamburger input {
    display: none;
  }

  .hamburger svg {
    /* The size of the SVG defines the overall size */
    height: 3em;
    /* Define the transition for transforming the SVG */
    transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .line {
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
    /* Define the transition for transforming the Stroke */
    transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
                stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .line-top-bottom {
    stroke-dasharray: 12 63;
  }

  .hamburger input:checked + svg,
  .hamburger.checked input + svg {
    transform: rotate(-45deg);
  }

  .hamburger input:checked + svg .line-top-bottom,
  .hamburger.checked input + svg .line-top-bottom {
    stroke-dasharray: 20 300;
    stroke-dashoffset: -32.42;
  }
`;

export default HamburgerMenu;
