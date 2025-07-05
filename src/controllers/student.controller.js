import db from '../models/index.js';

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               CourseIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of courses to assign
 *     responses:
 *       201:
 *         description: Course created
 */

export const createStudent = async (req, res) => {
    try {
        const { CourseIds, ...studentData } = req.body;
        const student = await db.Student.create(req.body);

        if (Array.isArray(CourseIds) && CourseIds.length > 0) {
            const courses = await db.Course.findAll({
                where: { id: CourseIds },
            });

            await student.addCourses(courses); 
        }
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *         type: string
 *         enum: [asc, desc]
 *         default: desc
 *         description: Sort by created time (ascending or descending)
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *           enum: [courseId, courses]
 *         description: Include related models (e.g., populate=courseId includes enrolled courses)
 *     responses:
 *       200:
 *         description: List of students
 */
export const getAllStudents = async (req, res) => {
    const sortBy = req.query.sort === 'desc' ? 'desc' : 'asc';
    // take certain amount at a time
    const limit = parseInt(req.query.limit) || 10;
    // which page to take
    const page = parseInt(req.query.page) || 1;

    const total = await db.Course.count();

    const populate = req.query.populate;
    const include = [];

    if (populate) {
        const fields = populate.split(',');
        if (fields.includes('courseId') || fields.includes('courses')) {
            include.push(db.Course);
        }
    }

    try {
        const students = await db.Student.findAll({
             //include: db.Course 
            limit: limit, offset: (page - 1) * limit ,
            order: [['id', sortBy]],
            include,
        });
        res.json({
            meta: {
                totalItems: total,
                page: page,
                totalPages: Math.ceil(total / limit),
            },
            data: students,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: A student
 *       404:
 *         description: Not found
 */
export const getStudentById = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id, { include: db.Course});
        if (!student) return res.status(404).json({ message: 'Not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update a student
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: 
 *             type: object
 *             required: [name, email, coursesId]
 *             properties:
 *               title:
 *                 type: string
 *               email:
 *                 type: string
 *               courseId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of courses to assign
 *     responses:
 *       200:
 *         description: Updated
 */
export const updateStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Not found' });
        await student.update(req.body);
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
export const deleteStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Not found' });
        await student.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
