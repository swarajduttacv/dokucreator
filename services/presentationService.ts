
declare const PptxGenJS: any;


interface SlideOptions {
  title: string;
  content: string[];
  chartImageBase64?: string;
  style: {
    font: string;
    color: string;
    backgroundColor: string;
  };
}

export const createSlide = async (options: SlideOptions): Promise<void> => {
    if (typeof PptxGenJS === 'undefined') {
        throw new Error("Presentation library (PptxGenJS) is not loaded. Please ensure you have an internet connection.");
    }

    if (!options.title) {
        throw new Error("Cannot create a slide without a title. The AI model may have returned an incomplete response.");
    }

    try {
      const pres = new PptxGenJS();
      pres.layout = 'LAYOUT_16x9';
      pres.author = 'DokuCreator';
      pres.subject = options.title;

      const slide = pres.addSlide();

      const bgColor = options.style.backgroundColor.replace('#', '');
      const textColor = options.style.color.replace('#', '');
      
      // Professional background with subtle gradient
      slide.background = { color: bgColor };

      // Accent line below title
      slide.addShape(pres.ShapeType.rect, {
        x: 0.5, y: 0.95, w: 9.0, h: 0.03,
        fill: { color: textColor, transparency: 70 },
      });

      // Title
      slide.addText(options.title, {
          x: 0.5,
          y: 0.2,
          w: 9.0,
          h: 0.75,
          fontSize: 28,
          fontFace: options.style.font,
          color: textColor,
          bold: true,
          align: 'center',
          valign: 'middle',
          fit: 'shrink',
      });
      
      const contentOptions = {
          fontSize: 13,
          fontFace: options.style.font, 
          color: textColor, 
          paraSpaceAfter: 6,
          lineSpacingMultiple: 1.15,
      };

      const formattedContent = options.content.map(point => ({
          text: point,
          options: { ...contentOptions, bullet: { indent: 20, type: 'bullet' } },
      }));

      if (options.chartImageBase64) {
          // Layout with chart: Text left, Chart right
          if (options.content.length > 0) {
              slide.addText(formattedContent, {
                  x: 0.5,
                  y: 1.15,
                  w: 4.5,
                  h: 4.0,
                  fit: 'shrink', 
                  valign: 'top',
              });
          }
          // Chart with subtle shadow effect
          slide.addImage({
              data: `data:image/png;base64,${options.chartImageBase64}`,
              x: 5.25,
              y: 1.15,
              w: 4.5,
              h: 4.0,
              rounding: true,
          });

      } else {
          // Text-only layout
          if (options.content.length > 0) {
              slide.addText(formattedContent, {
                  x: 0.75,
                  y: 1.15,
                  w: 8.5,
                  h: 4.0,
                  fit: 'shrink',
                  align: 'left',
                  valign: 'top',
              });
          }
      }

      // Footer with slide number
      slide.addText('Created with DokuCreator', {
          x: 0.5, y: 5.15, w: 4.0, h: 0.3,
          fontSize: 8, fontFace: options.style.font, color: textColor,
          transparency: 60, align: 'left', valign: 'bottom',
      });
      slide.addText(`Slide 1`, {
          x: 5.5, y: 5.15, w: 4.0, h: 0.3,
          fontSize: 8, fontFace: options.style.font, color: textColor,
          transparency: 60, align: 'right', valign: 'bottom',
      });
      
      await pres.writeFile({ fileName: `${options.title.replace(/\s+/g, '_') || 'presentation'}.pptx` });

    } catch (err) {
        console.error("Error creating presentation file:", err);
        throw new Error("Failed to create the .pptx file. An internal error occurred in the presentation library.");
    }
};


export const createMultiSlidePresentation = async (slides: SlideOptions[]): Promise<void> => {
    if (typeof PptxGenJS === 'undefined') {
        throw new Error("Presentation library (PptxGenJS) is not loaded.");
    }
    
    try {
        const pres = new PptxGenJS();
        pres.layout = 'LAYOUT_16x9';
        pres.author = 'DokuCreator';

        for (let idx = 0; idx < slides.length; idx++) {
            const options = slides[idx];
            const slide = pres.addSlide();
            
            const bgColor = options.style.backgroundColor.replace('#', '');
            const textColor = options.style.color.replace('#', '');
            
            slide.background = { color: bgColor };

            // Accent line
            slide.addShape(pres.ShapeType.rect, {
              x: 0.5, y: 0.95, w: 9.0, h: 0.03,
              fill: { color: textColor, transparency: 70 },
            });

            slide.addText(options.title, {
                x: 0.5, y: 0.2, w: 9.0, h: 0.75,
                fontSize: 28, fontFace: options.style.font, color: textColor,
                bold: true, align: 'center', valign: 'middle', fit: 'shrink',
            });

            const contentOptions = {
                fontSize: 13, fontFace: options.style.font, color: textColor, 
                paraSpaceAfter: 6, lineSpacingMultiple: 1.15,
            };

            const formattedContent = options.content.map(point => ({
                text: point,
                options: { ...contentOptions, bullet: { indent: 20, type: 'bullet' } },
            }));

            if (options.chartImageBase64) {
                if (options.content.length > 0) {
                    slide.addText(formattedContent, { x: 0.5, y: 1.15, w: 4.5, h: 4.0, fit: 'shrink', valign: 'top' });
                }
                slide.addImage({ data: `data:image/png;base64,${options.chartImageBase64}`, x: 5.25, y: 1.15, w: 4.5, h: 4.0 });
            } else {
                if (options.content.length > 0) {
                    slide.addText(formattedContent, { x: 0.75, y: 1.15, w: 8.5, h: 4.0, fit: 'shrink', align: 'left', valign: 'top' });
                }
            }

            // Footer
            slide.addText('Created with DokuCreator', {
                x: 0.5, y: 5.15, w: 4.0, h: 0.3,
                fontSize: 8, fontFace: options.style.font, color: textColor,
                transparency: 60, align: 'left', valign: 'bottom',
            });
            slide.addText(`Slide ${idx + 1}`, {
                x: 5.5, y: 5.15, w: 4.0, h: 0.3,
                fontSize: 8, fontFace: options.style.font, color: textColor,
                transparency: 60, align: 'right', valign: 'bottom',
            });
        }

        await pres.writeFile({ fileName: `DokuCreator_Presentation.pptx` });

    } catch (err) {
        console.error("Error creating multi-slide presentation:", err);
        throw new Error("Failed to create the .pptx file.");
    }
};
